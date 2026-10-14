import pandas as pd
import pytest

from backend.replay import DataGap, project_bars

BASE = 1672531200000
MINUTE = 60000


def fixture(start=0, count=300):
    return pd.DataFrame([
        dict(time=BASE+i*MINUTE, open=100+i, high=102+i, low=99+i, close=101+i, volume=2)
        for i in range(start, start+count)
    ])


@pytest.mark.parametrize("tf", [1, 5, 15, 60, 240])
def test_only_completed_minutes_reach_chart(tf):
    frame = fixture()
    frame.loc[25:, ["high", "volume"]] = 999999
    frame.loc[25:, "low"] = 0
    bars = project_bars(frame, BASE+25*MINUTE, tf, 500)
    assert bars[-1]["close"] == 125
    assert max(b["high"] for b in bars) == 126
    assert min(b["low"] for b in bars) == 99
    assert sum(b["volume"] for b in bars) == 50
    assert bars[-1]["time"] == BASE + (24//tf)*tf*MINUTE


def test_hour_partial_uses_only_first_25_minutes():
    bar = project_bars(fixture(), BASE+25*MINUTE, 60, 500)[0]
    assert bar == dict(time=BASE, open=100, high=126, low=99, close=125, volume=50)


def test_exact_boundary_does_not_reveal_new_minute():
    assert len(project_bars(fixture(), BASE+5*MINUTE, 5, 500)) == 1
    assert project_bars(fixture(), BASE+5*MINUTE-1, 5, 500)[0]["close"] == 104


def test_4h_is_aligned_to_utc_not_first_loaded_bar():
    bars = project_bars(fixture(0, 600), BASE+525*MINUTE, 240, 500)
    assert [b["time"] for b in bars] == [BASE, BASE+240*MINUTE, BASE+480*MINUTE]
    assert bars[-1]["volume"] == 90


def test_missing_minute_fails_closed():
    with pytest.raises(DataGap):
        project_bars(fixture().drop(index=12), BASE+25*MINUTE, 60, 500)


def test_future_gap_does_not_block_past():
    assert project_bars(fixture().drop(index=99), BASE+25*MINUTE, 60, 500)


def test_duplicate_cannot_double_volume():
    with pytest.raises(DataGap):
        project_bars(pd.concat([fixture(), fixture().iloc[[12]]]), BASE+25*MINUTE, 60, 500)


def test_incomplete_first_bucket_is_not_invented():
    bars = project_bars(fixture(7, 100), BASE+90*MINUTE, 60, 500)
    assert bars[0]["time"] == BASE+60*MINUTE
    assert bars[0]["volume"] == 60


def test_future_data_mutation_does_not_change_any_visible_bar():
    frame = fixture()
    before = project_bars(frame, BASE+25*MINUTE, 15, 500)
    frame.loc[25:, ["open", "high", "low", "close", "volume"]] = -999
    assert project_bars(frame, BASE+25*MINUTE, 15, 500) == before

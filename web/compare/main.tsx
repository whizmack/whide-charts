import { createRoot } from 'react-dom/client'
import '@fontsource/geist/400.css'
import '@fontsource/geist/500.css'
import '@dylanpersonguy/opencharts/style.css'
import './preview.css'
import Preview from './Preview'
createRoot(document.getElementById('root')!).render(<Preview/> )

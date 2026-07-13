import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { dataError } from './lib/data';

const LibraryPage = lazy(() => import('./pages/LibraryPage').then((module) => ({ default: module.LibraryPage })));
const ModelsPage = lazy(() => import('./pages/ModelsPage').then((module) => ({ default: module.ModelsPage })));
const ExamPage = lazy(() => import('./pages/ExamPage').then((module) => ({ default: module.ExamPage })));
const TrainingPage = lazy(() => import('./pages/TrainingPage').then((module) => ({ default: module.TrainingPage })));
const ParaphraseGamePage = lazy(() => import('./pages/ParaphraseGamePage').then((module) => ({ default: module.ParaphraseGamePage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((module) => ({ default: module.ProgressPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const SourcesPage = lazy(() => import('./pages/SourcesPage').then((module) => ({ default: module.SourcesPage })));
const PdfViewerPage = lazy(() => import('./pages/PdfViewerPage').then((module) => ({ default: module.PdfViewerPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

function RouteLoading() {
  return <section className="section shell"><div className="loading-card">جارٍ تحميل الصفحة…</div></section>;
}

export function App() {
  if (dataError) {
    return (
      <Layout>
        <section className="section shell">
          <div className="fatal-error__card">
            <span className="section-kicker">خطأ في البيانات</span>
            <h1>تعذر تحميل أمثلة التدريب</h1>
            <p>{dataError}</p>
            <button className="button button--primary" onClick={() => window.location.reload()}>إعادة التحميل</button>
          </div>
        </section>
      </Layout>
    );
  }
  return (
    <Layout>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/models/:modelId" element={<ExamPage />} />
          <Route path="/train" element={<TrainingPage />} />
          <Route path="/phrases" element={<ParaphraseGamePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/pdf" element={<PdfViewerPage />} />
          <Route path="/pdf-viewer" element={<PdfViewerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

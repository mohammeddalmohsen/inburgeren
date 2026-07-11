import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { dataError } from './lib/data';

const LibraryPage = lazy(() => import('./pages/LibraryPage').then((module) => ({ default: module.LibraryPage })));
const ModelsPage = lazy(() => import('./pages/ModelsPage').then((module) => ({ default: module.ModelsPage })));
const ExamPage = lazy(() => import('./pages/ExamPage').then((module) => ({ default: module.ExamPage })));
const TrainingPage = lazy(() => import('./pages/TrainingPage').then((module) => ({ default: module.TrainingPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((module) => ({ default: module.ProgressPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));

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
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

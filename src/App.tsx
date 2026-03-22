/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Bible from "./pages/Bible";
import Episodes from "./pages/Episodes";
import Structure from "./pages/Structure";
import BeatBoard from "./pages/BeatBoard";
import Script from "./pages/Script";
import Breakdown from "./pages/Breakdown";
import Storyboard from "./pages/Storyboard";
import Studio from "./pages/Studio";
import ImageGen from "./pages/ImageGen";
import VideoGen from "./pages/VideoGen";
import AudioGen from "./pages/AudioGen";
import Assets from "./pages/Assets";
import Settings from "./pages/Settings";
import { useEffect } from "react";
import { useProjectStore } from "./store/useProjectStore";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  const { fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#171717',
          color: '#fff',
          border: '1px solid #262626',
        },
      }} />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Projects />} />
            <Route path="projects" element={<Projects />} />
            <Route path="new-project" element={<Home />} />
            <Route path="image-gen" element={<ImageGen />} />
            <Route path="video-gen" element={<VideoGen />} />
            <Route path="audio-gen" element={<AudioGen />} />
            <Route path="assets" element={<Assets />} />
            <Route path="settings" element={<Settings />} />
            <Route path="bible" element={<Bible />} />
            <Route path="episodes" element={<Episodes />} />
            <Route path="structure" element={<Structure />} />
            <Route path="beatboard" element={<BeatBoard />} />
            <Route path="script" element={<Script />} />
            <Route path="breakdown" element={<Breakdown />} />
            <Route path="storyboard" element={<Storyboard />} />
            <Route path="studio" element={<Studio />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

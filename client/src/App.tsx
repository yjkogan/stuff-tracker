import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import CategoryList from './pages/CategoryList';
import ItemEditor from './pages/ItemEditor';
import RankMode from './components/RankMode';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="category/:category" element={<CategoryList />} />
                    <Route path="new" element={<ItemEditor />} />
                    <Route path="item/:id" element={<ItemEditor />} />
                    <Route path="rank" element={<RankMode />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

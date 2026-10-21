import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfiguratorPage from './pages/ConfiguratorPage'
import ConfirmationPage from './pages/ConfirmationPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="zamow" element={<ConfiguratorPage />} />
                <Route path="koszyk" element={<CartPage />} />
                <Route path="zamowienie" element={<CheckoutPage />} />
                <Route path="potwierdzenie" element={<ConfirmationPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    )
}
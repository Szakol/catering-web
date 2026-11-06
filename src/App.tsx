import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfiguratorPage from './pages/ConfiguratorPage'
import ConfirmationPage from './pages/ConfirmationPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

// Panel administratora ładuje się osobno: klienci sklepu nie pobierają jego kodu.
const AdminRoot = lazy(() => import('./admin/AdminRoot'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const LoginPage = lazy(() => import('./admin/pages/LoginPage'))
const OrdersPage = lazy(() => import('./admin/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('./admin/pages/OrderDetailPage'))
const NewOrderPage = lazy(() => import('./admin/pages/NewOrderPage'))
const MenuItemsPage = lazy(() => import('./admin/pages/MenuItemsPage'))
const MenuItemFormPage = lazy(() => import('./admin/pages/MenuItemFormPage'))
const ProductsPage = lazy(() => import('./admin/pages/ProductsPage'))
const StatsPage = lazy(() => import('./admin/pages/StatsPage'))
const SettingsPage = lazy(() => import('./admin/pages/SettingsPage'))

export default function App() {
    return (
        <Suspense fallback={<p className="p-6 text-stone-500">Ładowanie…</p>}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="zamow" element={<ConfiguratorPage />} />
                    <Route path="koszyk" element={<CartPage />} />
                    <Route path="zamowienie" element={<CheckoutPage />} />
                    <Route path="potwierdzenie" element={<ConfirmationPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="admin" element={<AdminRoot />}>
                    <Route path="login" element={<LoginPage />} />
                    <Route element={<AdminLayout />}>
                        <Route index element={<OrdersPage />} />
                        <Route path="zamowienia/nowe" element={<NewOrderPage />} />
                        <Route path="zamowienia/:id" element={<OrderDetailPage />} />
                        <Route path="menu" element={<MenuItemsPage />} />
                        <Route path="menu/nowa" element={<MenuItemFormPage />} />
                        <Route path="menu/:id" element={<MenuItemFormPage />} />
                        <Route path="produkty" element={<ProductsPage />} />
                        <Route path="statystyki" element={<StatsPage />} />
                        <Route path="ustawienia" element={<SettingsPage />} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    )
}
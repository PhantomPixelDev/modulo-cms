// The shop's admin screens. The core loads this bundle the first time one of
// them is visited (Inertia page "Plugins/modulo-shop/<Screen>").
import Coupons from './screens/Coupons';
import Orders from './screens/Orders';
import OrderView from './screens/OrderView';
import Payments from './screens/Payments';
import Products from './screens/Products';
import Settings from './screens/Settings';

window.Modulo!.registerComponents('modulo-shop', {
    Products,
    Orders,
    OrderView,
    Coupons,
    Payments,
    Settings,
});

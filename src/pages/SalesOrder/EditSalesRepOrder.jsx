import { useLocation } from "react-router-dom";
import SalesRepOrderForm from "../../components/SalesOrder/SalesRepOrderForm";

const EditSalesRepOrder = () => {
    const { state } = useLocation();
    return <SalesRepOrderForm mode="edit" initialInvoice={state?.invoice} />;
};

export default EditSalesRepOrder;

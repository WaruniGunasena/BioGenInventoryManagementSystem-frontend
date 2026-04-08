import { useLocation } from "react-router-dom";
import SalesOrderForm from "../../components/SalesOrder/SalesOrderForm";

const EditSalesOrder = () => {
    const { state } = useLocation();
    return <SalesOrderForm mode="edit" initialInvoice={state?.invoice} />;
};

export default EditSalesOrder;

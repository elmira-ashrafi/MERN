import "bootstrap/dist/css/bootstrap.min.css"
import "antd/dist/reset.css"
import "../public/css/styles.css"
import "react-toastify/dist/ReactToastify.css"
import {Provider} from "../context"
import { ToastContainer } from "react-toastify"
import { ConfigProvider } from "antd"
import Header from "../components/Header"

function MyApp({Component, pageProps}) {

    return (
        <Provider> 
            <ConfigProvider theme={{token: {itemSelectedColor: '#0d6efd'}}} >
                <Header />
                <Component {... pageProps} />
                <ToastContainer />
            </ConfigProvider>
        </Provider>
    )
    
}

export default MyApp
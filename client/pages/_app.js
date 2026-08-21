import "bootstrap/dist/css/bootstrap.min.css"
import "antd/dist/reset.css"
import "../public/css/styles.css"
import "react-toastify/dist/ReactToastify.css"
import {Provider} from "../context/auth"
import { ToastContainer } from "react-toastify"
import { ConfigProvider } from "antd"
import Header from "../components/Header"
import Footer from "../components/Footer"

function MyApp({Component, pageProps}) {

    return (
        <Provider> 
            <ConfigProvider theme={{token: {itemSelectedColor: '#0d6efd'}}} >
                {/* plain flex column: no transform or clipping, so ScrollTrigger can still pin inside */}
                <div className="min-vh-100 d-flex flex-column">
                    <Header />
                    <main className="flex-grow-1">
                        <Component {... pageProps} />
                    </main>
                    <Footer />
                </div>
                <ToastContainer />
            </ConfigProvider>
        </Provider>
    )
    
}

export default MyApp
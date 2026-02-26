import axios from "axios";
import { adaptErrorResponse } from "./util";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response:any) => response,
    (error:any) => {
        // Optionally, you can show a toast or log error here
        return Promise.reject(adaptErrorResponse(error));
    }
);

export default api; 
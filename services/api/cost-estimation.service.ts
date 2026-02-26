import { Supabase } from "./util";
import { api } from "./http";

export class CostEstimationService extends Supabase {
    constructor() {
        super();
    }

    private async checkAuth(): Promise<boolean> {
        const { session } = (await this.supabase.auth.getSession()).data;
        return !!session?.access_token;
    }

    private async ensureAuthenticated() {
        const isAuthenticated = await this.checkAuth();
        if (!isAuthenticated) {
            throw new Error('Authentication required. Please log in.');
        }
    }

    async createCostEstimation(data: any) {
        return await api.post(`/api/cost-estimations`, data);
    }

    async updateCostEstimation(cost_estimation_id: string, data: any) {
        return await api.patch(`/api/cost-estimations/${cost_estimation_id}`, data);
    }

    async deleteCostEstimation(cost_estimation_id: string) {
        return await api.delete<{ cost_estimation_id: string }>(`/api/cost-estimations/${cost_estimation_id}`);
    }

    async getCostEstimations({page = 1, pageSize = 10, sort = { field: "created_at", dir: "desc" } }) {
        const params = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
            sortField: String(sort.field),
            sortDir: String(sort.dir),
        });
        return await api.get<{ data: any[]; count: number }>(`/api/cost-estimations?${params.toString()}`);
    }

    /**
     * Update all cost_estimations for a dropdown value change.
     * @param type - The dropdown type ('projectType' | 'stylePreference' | 'specification')
     * @param oldValue - The value to replace
     * @param newValue - The new value
     */
    async updateDropdownValue(type: 'projectType' | 'stylePreference' | 'specification', oldValue: string, newValue: string) {
        return await api.post(`/api/cost-estimations/update-dropdown`, { type, oldValue, newValue });
    }
}
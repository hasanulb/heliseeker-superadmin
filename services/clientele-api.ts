import { ClienteleGroupType, ClientLogoType, ClienteleGroupWithLogos, ReorderRequestType, ClienteleGroupFormInputType, ClientLogoFormInputType } from "@/app/admin/content/clientele/types";

export class ClienteleService {
  private baseUrl = '/api';

  // Groups
  async getGroups(): Promise<ClienteleGroupType[]> {
    const response = await fetch(`${this.baseUrl}/clientele-groups`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  }

  async getGroupsWithLogos(): Promise<ClienteleGroupWithLogos[]> {
    const response = await fetch(`${this.baseUrl}/clientele-groups?includeLogos=true`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  }

  async getGroup(id: string): Promise<ClienteleGroupWithLogos> {
    const response = await fetch(`${this.baseUrl}/clientele-groups/${id}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  }

  async createGroup(data: ClienteleGroupFormInputType): Promise<ClienteleGroupType> {
    const response = await fetch(`${this.baseUrl}/clientele-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  }

  async updateGroup(id: string, data: ClienteleGroupFormInputType): Promise<ClienteleGroupType> {
    const response = await fetch(`${this.baseUrl}/clientele-groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  }

  async deleteGroup(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/clientele-groups/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
  }

  async reorderGroups(items: ReorderRequestType['items']): Promise<void> {
    const response = await fetch(`${this.baseUrl}/clientele-groups/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
  }

  // Logos
  async getLogos(groupId?: string): Promise<ClientLogoType[]> {
    const url = groupId
      ? `${this.baseUrl}/client-logos?groupId=${groupId}`
      : `${this.baseUrl}/client-logos`;
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  }

  async getLogo(id: string): Promise<ClientLogoType> {
    const response = await fetch(`${this.baseUrl}/client-logos/${id}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  }

  async createLogo(data: ClientLogoFormInputType): Promise<ClientLogoType> {
    const response = await fetch(`${this.baseUrl}/client-logos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  }

  async updateLogo(id: string, data: ClientLogoFormInputType): Promise<ClientLogoType> {
    const response = await fetch(`${this.baseUrl}/client-logos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  }

  async deleteLogo(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/client-logos/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
  }

  async reorderLogos(items: ReorderRequestType['items']): Promise<void> {
    const response = await fetch(`${this.baseUrl}/client-logos/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
  }
}
import { create } from "zustand";

const useFileStore = create((set) => ({
    pendingUpload: null, // { campaignId, file }
    setPendingUpload: (upload) => set({ pendingUpload: upload }),
    clearPendingUpload: () => set({ pendingUpload: null }),
}));

export default useFileStore;

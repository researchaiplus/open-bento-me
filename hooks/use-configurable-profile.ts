/**
 * Profile Data Hook
 *
 * React hook for fetching and managing profile data using adapters.
 * Works with both DatabaseAdapter and LocalStorageAdapter.
 */

import { useCallback } from 'react'
import useSWR from 'swr'
import {
  ProfileDataAdapter,
  AdapterBentoItem,
} from '@/lib/adapters'
import { ProfileData, ProfileUpdateData } from '@/types/profile'
import { BentoItem } from '@/types/bento'

/**
 * Hook for managing profile data with an adapter
 */
export function useConfigurableProfile(adapter: ProfileDataAdapter | null) {
  const { data: profile, error: profileError, isLoading: profileLoading, mutate: mutateProfile } = useSWR(
    adapter ? ['profile', adapter.getAdapterName()] : null,
    async () => {
      if (!adapter) return null
      return adapter.getProfile()
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const updateProfile = useCallback(
    async (data: Partial<ProfileUpdateData>) => {
      if (!adapter) throw new Error('No adapter available')

      await adapter.updateProfile(data)
      await mutateProfile()
    },
    [adapter, mutateProfile]
  )

  return {
    profile,
    isLoading: profileLoading,
    error: profileError,
    updateProfile,
    mutateProfile,
  }
}

/**
 * Hook for managing bento grid items with an adapter
 */
export function useConfigurableBentoItems(adapter: ProfileDataAdapter | null) {
  const { data: items, error: itemsError, isLoading: itemsLoading, mutate: mutateItems } = useSWR(
    adapter ? ['bento-items', adapter.getAdapterName()] : null,
    async () => {
      if (!adapter) return []
      return adapter.getBentoItems()
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const addBentoItem = useCallback(
    async (item: Omit<AdapterBentoItem, 'id'>) => {
      if (!adapter) throw new Error('No adapter available')

      const newItem = await adapter.addBentoItem(item)
      await mutateItems()
      return newItem
    },
    [adapter, mutateItems]
  )

  const updateBentoItem = useCallback(
    async (id: string, updates: Partial<AdapterBentoItem>) => {
      if (!adapter) throw new Error('No adapter available')

      await adapter.updateBentoItem(id, updates)
      await mutateItems()
    },
    [adapter, mutateItems]
  )

  const deleteBentoItem = useCallback(
    async (id: string) => {
      if (!adapter) throw new Error('No adapter available')

      await adapter.deleteBentoItem(id)
      await mutateItems()
    },
    [adapter, mutateItems]
  )

  return {
    items: items || [],
    isLoading: itemsLoading,
    error: itemsError,
    addBentoItem,
    updateBentoItem,
    deleteBentoItem,
    mutateItems,
  }
}

/**
 * Combined hook for managing all profile data
 */
export function useConfigurableProfileData(adapter: ProfileDataAdapter | null) {
  const profile = useConfigurableProfile(adapter)
  const bentoItems = useConfigurableBentoItems(adapter)

  return {
    profile: profile.profile,
    profileLoading: profile.isLoading,
    profileError: profile.error,
    updateProfile: profile.updateProfile,
    mutateProfile: profile.mutateProfile,

    items: bentoItems.items,
    itemsLoading: bentoItems.isLoading,
    itemsError: bentoItems.error,
    addBentoItem: bentoItems.addBentoItem,
    updateBentoItem: bentoItems.updateBentoItem,
    deleteBentoItem: bentoItems.deleteBentoItem,
    mutateItems: bentoItems.mutateItems,

    isLoading: profile.isLoading || bentoItems.isLoading,
    hasError: !!profile.error || !!bentoItems.error,
  }
}

/**
 * Export configuration
 */
export function useExportConfig(adapter: ProfileDataAdapter | null) {
  const exportConfig = useCallback(() => {
    if (!adapter) throw new Error('No adapter available')
    return adapter.exportConfig()
  }, [adapter])

  return { exportConfig }
}

/**
 * Import configuration
 */
export function useImportConfig(adapter: ProfileDataAdapter | null) {
  const importConfig = useCallback(
    async (config: any) => {
      if (!adapter) throw new Error('No adapter available')
      await adapter.importConfig(config)
    },
    [adapter]
  )

  return { importConfig }
}

'use client';

import { useLocale } from 'next-intl';
import { localized } from '@/lib/localized';
import { useGetMunicipalitiesQuery, useGetProvincesQuery } from '@/store/api/geoApi';

// An order's address snapshot stores ids for the province and municipality (names
// live in the global reference tables, which never change under an order), so the
// human-readable place is looked up here. Cached for a day by the API.
interface AddressLike {
  provinceId: string;
  municipalityId: string;
  street: string;
  betweenStreets?: string | null;
  buildingApartment?: string | null;
  neighborhood?: string | null;
  referencePoints?: string | null;
}

export function useAddressText(address: AddressLike | null) {
  const locale = useLocale();
  const { data: provinces } = useGetProvincesQuery();
  const { data: municipalities } = useGetMunicipalitiesQuery(address?.provinceId ?? '', { skip: !address });
  if (!address) return { line: '', area: '' };

  const province = provinces?.find((p) => p.id === address.provinceId);
  const municipality = municipalities?.find((m) => m.id === address.municipalityId);
  const line = [address.street, address.buildingApartment, address.betweenStreets ? `e/ ${address.betweenStreets}` : null]
    .filter(Boolean)
    .join(', ');
  const area = [address.neighborhood, municipality && localized(locale, municipality.nameEs, municipality.nameEn), province && localized(locale, province.nameEs, province.nameEn)]
    .filter(Boolean)
    .join(', ');
  return { line, area, reference: address.referencePoints ?? null };
}

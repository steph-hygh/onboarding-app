export const PRODUCT_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    featuredImage { url altText }
    selectedOrFirstAvailableVariant {
      id
      availableForSale
      price { amount currencyCode }
    }
  }
`;

export const PRODUCT_QUERY = `#graphql
  query Product($id: ID!, $country: CountryCode, $language: LanguageCode) 
    @inContext(country: $country, language: $language) {
      product(id: $id) { ...ProductCard }
  }
  ${PRODUCT_FRAGMENT}
`;

export const PRODUCT_REFERENCE_QUERY = `#graphql
  query ProductReference{
    shop {
      metafield(namespace: "custom" key: "product_reference" ) {
        value
      }
    }
  }
`;
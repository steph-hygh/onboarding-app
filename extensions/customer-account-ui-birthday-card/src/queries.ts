export const CUSTOMER_BIRTHDAY_QUERY = `#graphql
  query customer {
    customer {
      metafield(key: "birth_date" namespace: "facts") {
        value
      }
    }
  }
`;

export const CUSTOMER_SAVE_BIRTHDAY_MUTATION = `#graphql
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

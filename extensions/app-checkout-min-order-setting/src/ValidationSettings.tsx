import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState, useRef } from "preact/hooks";

const METAFIELD_NAMESPACE = "$app:min-order";
const METAFIELD_KEY = "min-order-value-decimal";

export default async () => {
  const existingDefinition = await getMetafieldDefinition();
  if (!existingDefinition) {
    // Create a metafield definition for persistence if no pre-existing definition exists
    const metafieldDefinition = await createMetafieldDefinition();

    if (!metafieldDefinition) {
      throw new Error("Failed to create metafield definition");
    }
  }

  const metafield = shopify.data.validation?.metafields?.find(
    (metafield) => (metafield.key === METAFIELD_KEY));

  const threshold = metafield?.value ?? '20';

  render(
    <Extension threshold={threshold} />,
    document.body
  );
};

function Extension( {threshold: initialThreshold } : {threshold : string} ) {
  const [savedThreshold, setSavedThreshold] = useState(initialThreshold);
  const [errors, setErrors] = useState<string[]>([]);

  const currentValue = useRef(initialThreshold);

  const applyMetafieldUpdate = async (threshold: string) => {
  
    const thresholdNumber =  Number(threshold.trim());
    if (threshold.trim() == ''
        || thresholdNumber < 0
        || !Number.isFinite(thresholdNumber)
    ) {
      const error = "Minimum order value must be 0 or more"
      setErrors([error])
      throw new Error(error);
    }

    const result = await shopify.applyMetafieldChange({
      type: "updateMetafield",
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEY,
      value: thresholdNumber,
    });

    if (result.type === "error") {
      setErrors([result.message]);
      throw new Error(result.message);
    } else {
      setSavedThreshold(String(thresholdNumber));
      setErrors([]);
    }
  };

  const updateThreshold = ((value: string)  => {
    currentValue.current = value;
  });

  return (
    <s-function-settings onSubmit={(event) => event.waitUntil?.(applyMetafieldUpdate(currentValue.current))}
                         onReset={() => { 
                          currentValue.current = savedThreshold;
                          setErrors([]);
                        }}
    >
      <ErrorBanner errors={errors} />

      <s-number-field
        step={0.01}
        min={0}
        details="Order value in buyer's currency"
        label="Minimal Order Value"
        name="min-order"
        onChange={(event) => updateThreshold(event.currentTarget.value) }
        defaultValue={savedThreshold}
      ></s-number-field>
    </s-function-settings>
  );
}

function ErrorBanner({ errors } : any) {
  if (errors.length === 0) return null;
  return (
    <s-stack gap="base">
      {errors.map((error:string, i:number) => (
        <s-banner key={i} heading="Error" tone="critical">
          {error}
        </s-banner>
      ))}
    </s-stack>
  );
}

async function getMetafieldDefinition() {
  const query = `#graphql
    query GetMetafieldDefinition {
      metafieldDefinitions(first: 1, ownerType: VALIDATION, namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") {
        nodes {
          id
          type {
            category
            name
          }
        }
      }
    }
  `;

  const result = await shopify.query<any>(query);

  return result?.data?.metafieldDefinitions?.nodes[0];
}


async function createMetafieldDefinition() {
  const definition = {
    access: {
      admin: "MERCHANT_READ_WRITE",
    },
    key: METAFIELD_KEY,
    name: "Validation Configuration",
    namespace: METAFIELD_NAMESPACE,
    ownerType: "VALIDATION",
    type: "number_decimal",
  };

  const query = `#graphql
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
            id
          }
        userErrors {
          code,
          field
          message
        }
      }
    }
    
  `;

  const variables = { definition };
  const result = await shopify.query<any>(query, { variables });

  return result?.data?.metafieldDefinitionCreate?.createdDefinition;
}

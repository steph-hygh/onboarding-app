import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/UpsellReferenceProduct.tsx' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.block.render').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/queries.ts' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.block.render').Api;
  const globalThis: { shopify: typeof shopify };
}

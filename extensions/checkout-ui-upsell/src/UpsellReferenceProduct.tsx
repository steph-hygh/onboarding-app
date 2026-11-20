import '@shopify/ui-extensions/preact';
import type {CartLineAddChange} from '@shopify/ui-extensions/checkout';
import {render} from "preact";
import {useEffect, useState} from 'preact/hooks';
import {ProductQuery, ProductReferenceQuery, ProductCardFragment as ProductCard} from '../../../shared/types/storefront.generated';

import { PRODUCT_QUERY, PRODUCT_REFERENCE_QUERY } from './queries';

export default async () => {
  render(<Extension />, document.body)
};

function Extension() {

  const [product, setProduct] = useState<ProductCard | null>(null);
  const [hideMe, setHideMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

   useEffect(() => {
    loadReferenceProduct();
  }, []);

  if (hideMe || isReferenceProductInCart()) 
    return;

  if (!product)
    return loadingSkeleton();

  return (
      <s-stack gap="base">
        <s-heading>{shopify.i18n.translate('upsell_headline')}</s-heading>
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-product-thumbnail src={product.featuredImage?.url} alt={product.featuredImage?.altText ?? undefined} />
          <s-stack gap="small-200">
            <s-text type="strong">{product.title}</s-text>
            <s-text>{formattedPrice()}</s-text>
          </s-stack>
        </s-stack>

        <s-button variant="primary" inlineSize="fill" onClick={addProductToCart} loading={loading}>
          {shopify.i18n.translate('addToCart')}
        </s-button>
      </s-stack>
  );

  function formattedPrice(): string {
    if (product?.selectedOrFirstAvailableVariant?.price) {
      const price = product.selectedOrFirstAvailableVariant?.price;
      return shopify.i18n.formatCurrency(Number(price.amount), { currency: price?.currencyCode});
    }
    return '';
  }

  function addProductToCart(): void {
    const variantId = product?.selectedOrFirstAvailableVariant?.id;
    if (!variantId) return;
    setLoading(true);
    
    const change: CartLineAddChange = {
      type: 'addCartLine',
      merchandiseId: variantId,
      quantity: 1,
    };
    shopify.applyCartLinesChange(change).finally(() => setHideMe(true))
  }


  function loadReferenceProduct (): void {
    shopify.query<ProductReferenceQuery>(PRODUCT_REFERENCE_QUERY)
    .then(({ data }) => {
      if (data?.shop?.metafield?.value) {
        return data?.shop?.metafield?.value;
      }
      throw Error('No reference product set');
    })
    .then((referenceGid) => {
      const variables = { 
        id:       referenceGid,
        country:  shopify.localization.country.value?.isoCode,
        language: shopify.localization.language.value?.isoCode.split('-')[0].toUpperCase()
      }
      return shopify.query<ProductQuery>(PRODUCT_QUERY, { variables })
    })
    .then(({ data }) => {
      if (data?.product && data?.product?.selectedOrFirstAvailableVariant) {
        setProduct(data.product);
      } else {
        throw Error('invalid product data');
      }
    })
    .catch((error) => {
      console.warn(error);
      setHideMe(true);
    })
  };

  function isReferenceProductInCart(): boolean {
    return !!product && shopify.lines.value.some(cartLine => {
      const aCartProductId = cartLine.merchandise.product.id;
      return aCartProductId === product.id;
    })
  }


  function loadingSkeleton() {
    return <s-stack gap="base">
      <s-heading>{shopify.i18n.translate('upsell_headline')}</s-heading>
      <s-stack direction="inline" gap="base" alignItems="center">
        <s-product-thumbnail />
        <s-stack gap="small-200">
          <s-skeleton-paragraph content="Product title" />
          <s-skeleton-paragraph content="€00.00" />
        </s-stack>
      </s-stack>

      <s-button variant="primary" inlineSize="fill" loading>
        {shopify.i18n.translate('addToCart')}
      </s-button>
    </s-stack>;
  }
}
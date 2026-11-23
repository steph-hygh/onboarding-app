import type {
  CartValidationsGenerateRunInput,
  CartValidationsGenerateRunResult,
  ValidationError,
} from "../generated/api";

export function cartValidationsGenerateRun(input: CartValidationsGenerateRunInput): CartValidationsGenerateRunResult {

  const step = input.buyerJourney.step;
  const inCheckout =
    step === "CHECKOUT_INTERACTION" || step === "CHECKOUT_COMPLETION";

  if (!inCheckout) {
    return { operations : []};
  }

  let minOrderValue = 20;
  const metafieldValue = Number(input.validation.metafield?.value);
  if (metafieldValue >= 0 && Number.isFinite(metafieldValue)) {
    minOrderValue = metafieldValue;
  }

  const totalAmount = Number(input.cart.cost.totalAmount.amount);
  const currency = input.cart.cost.totalAmount.currencyCode;

  const errors: ValidationError[] = [];
  if (totalAmount < minOrderValue) {
    errors.push(
      {
        message: `Min order amount ${minOrderValue} ${currency}`,
        target: "$.cart"
      }
    );
  }

  const operations = [
    {
      validationAdd: {
        errors
      },
    },
  ];

  return { operations };
};
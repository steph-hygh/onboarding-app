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

  const totalAmount = Number(input.cart.cost.totalAmount.amount);
  const currency = input.cart.cost.totalAmount.currencyCode;

  const errors: ValidationError[] = [];
  if (totalAmount < 20) {
    errors.push(
      {
        message: `Min order amount 20 ${currency}`,
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
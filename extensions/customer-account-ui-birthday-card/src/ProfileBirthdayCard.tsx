import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useEffect, useState, useRef} from 'preact/hooks';
import {CUSTOMER_BIRTHDAY_QUERY, CUSTOMER_SAVE_BIRTHDAY_MUTATION} from './queries'
import {type CustomerQuery, MetafieldsSetMutationVariables} from '../../../shared/types/customer.generated';
import {type MetafieldsSetInput} from '../../../shared/types/customer.types';


export default async () => {
  render(<Extension />, document.body)
}

type CustomerQueryResponse = {
  data: CustomerQuery,
  errors: any;
}

function Extension() {

  const today = new Date();
  // default 18 years old
  const defaultBirthday = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
        .toISOString().slice(0, 10);

  const [birthday, setBirthday] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const datePicker = useRef<any>(null)
  const datePickerModal = useRef<any>(null)

  useEffect(() => {
   fetchCustomerBirthdate(); 
  }, []);

  function saveBirthday(event: Event): void
  {
    setLoading(true);

    const newBirthdate = datePicker.current?.value;
    const previousBirthdate = birthday;

    setBirthday(newBirthdate);
    saveCustomerBirthdate(newBirthdate).then((response) => {
      
      datePickerModal.current?.hideOverlay();
      
    }).catch((error) => {
      console.error(error);
      setBirthday(previousBirthdate);
    }).finally(() => {
      // after modal close, avoid flicker
      setTimeout(() => {
        setLoading(false)
      }, 100);
    })
    ;  
  }

  return (
    <s-stack gap='base' >
      <s-stack direction='inline' gap='base' alignItems='center' justifyContent='space-between'>
        <s-heading>{shopify.i18n.translate('birthday')}</s-heading>
        <s-button variant='secondary' command="--show" commandFor="modal-birthday">{shopify.i18n.translate('edit')}</s-button>
      </s-stack>
      <s-section>
        <s-stack direction='inline' gap='base' alignItems='center' justifyContent='space-between'>
          <s-text color='subdued'> {shopify.i18n.translate('birthday')} </s-text>
          <s-text color={birthday? 'base' : 'subdued' }>{birthday || shopify.i18n.translate('undefined')}</s-text>
        </s-stack>
      </s-section>

      <s-modal ref={datePickerModal} id="modal-birthday" heading={shopify.i18n.translate('birthday')}>
        <s-date-field ref={datePicker} value={birthday || defaultBirthday}></s-date-field>
        <s-button variant="primary" onClick={saveBirthday} slot="primary-action" loading={loading}>Save</s-button>
      </s-modal>
    </s-stack>
    
    
  );

  async function saveCustomerBirthdate(newBirthdate: string): Promise<Response>  {

    const variables:MetafieldsSetMutationVariables = {
     metafields : [
        {
          "key": "birth_date",
          "namespace": "facts",
          "ownerId": `gid://shopify/Customer/${shopify.authenticatedAccount.customer.value?.id}`,
          "value": newBirthdate
        }
      ]
    };

    return fetch('shopify://customer-account/api/2026-10/graphql.json', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: CUSTOMER_SAVE_BIRTHDAY_MUTATION, variables: variables })
    });
  }
  
  function fetchCustomerBirthdate() {

    fetch('shopify://customer-account/api/2026-10/graphql.json', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: CUSTOMER_BIRTHDAY_QUERY })
    }
    ).then((response) => {
      return response.json() as Promise<CustomerQueryResponse>;
    })
      .then(({ data, errors }) => {
        if (errors) {
          throw new Error(errors);
        }
        if (data.customer.metafield?.value) {
          setBirthday(data.customer.metafield?.value);
        }
      });
  }
}
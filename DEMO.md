# Demostration of StableRent
Starting with some addresses and etherscan links. 

- Deployment + Processor Wallet Address: [0xbA2994967b75c22DBF9833fFD0A749BD66e7F0F3](https://sepolia.etherscan.io/address/0xbA2994967b75c22DBF9833fFD0A749BD66e7F0F3)

- Sender Wallet Address: [0xe193e3d8f2F50fB451A3990c18e7A78E095121e5](https://sepolia.etherscan.io/address/0xe193e3d8f2F50fB451A3990c18e7A78E095121e5)

- Reciever Wallet Address: [0xe4DDC07abb37Cf651f0c99fCbAf31F3D18a53fa0](https://sepolia.etherscan.io/address/0xe4DDC07abb37Cf651f0c99fCbAf31F3D18a53fa0) 

- StableRentSubscription.sol: [0x278dD89e80B01772affcC8cAEa6e45fFF8Ae3339](https://sepolia.etherscan.io/address/0x278dD89e80B01772affcC8cAEa6e45fFF8Ae3339)  

## Local Testing 

Envio indexing the contract creation 

![Envio screenshot of terminal logs](./images/envio_local_contract_deployment.png)

## Signing an Approval 
Setting up a new recurring payment.

Sender signed a $5 approval: [Etherscan Transcation](https://sepolia.etherscan.io/address/0xe193e3d8f2F50fB451A3990c18e7A78E095121e5)

![Signing the allowance](./images/sign_allowance_metamask.png)
![Signing the allowance](./images/sign_allowance_success.png)

Making a subscription: [0xaa95941c1cfdb1b27c7d28298cf0640983b2a292c0ac7ce4d415f688d8ff1fa8](https://sepolia.etherscan.io/tx/0xaa95941c1cfdb1b27c7d28298cf0640983b2a292c0ac7ce4d415f688d8ff1fa8)

![Making the subscription event](./images/set_up_payment_metamask.png)

## Railway Backend 
Triggering new smart contract call to process a recurring payment 

![Recurring payments success](./images/railway_recurring_cron_success.png)

## An actual payment 




## Recurring payment 


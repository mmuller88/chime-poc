# chime-poc

...

## Deploy

Install the dependencies first:

```bash
yarn install-all
```

Then deploy the CDK stack and React App

```bash
yarn deploy
```

Destroy via

```bash
yarn destroy
```

## Frontend

```bash
cd frontend
yarn start
```

## Can I change the language used in the demo?

Yes, the demo supports localization using [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) internationalization frameworks. Follow the steps mentioned in `frontend/src/localization/index.ts` to support your language.
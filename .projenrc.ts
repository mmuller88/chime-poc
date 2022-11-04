import * as pj from 'projen';
import { TrailingComma } from 'projen/lib/javascript';

/**
 * The following are some better comments helper (https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)
 * * That is so important
 * ! Deprecated stuff
 * ? being used as a question
 * TODO: aha
 * @param myParam The parameter for this method
 */
const project = new pj.typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'senjuns',
  projenrcTs: true,
  eslint: true,
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
      trailingComma: TrailingComma.ALL,
    },
  },
  devDeps: ['lint-staged'],
  // release: true,
});
project.prettier?.addIgnorePattern('.eslintrc.json');
project.prettier?.addIgnorePattern('tsconfig.dev.json');
project.prettier?.addIgnorePattern('tsconfig.json');
project.prettier?.addIgnorePattern('backend/cdk.json');

project.setScript(
  'install-all',
  'cd backend && yarn install && cd ../frontend && yarn install',
);

project.setScript(
  'deploy',
  'yarn install-all && cd frontend && yarn build && cd ../backend && yarn deploy:no-approval ',
);

project.setScript(
  'dev',
  'curl https://d3oyzoc11xndeg.cloudfront.net/runtime-config.json > frontend/public/runtime-config.json && cd frontend && yarn start',
);

project.setScript('destroy', 'cd backend && destroy');

project.package.addField('lint-staged', {
  '*.(ts|tsx)': ['eslint --fix'],
  '*.(ts|tsx|js|jsx|json)': ['prettier --write'],
});
project.setScript('lint:staged', 'lint-staged');

project.tsconfigDev?.addInclude('backend/**/*.ts');

project.synth();

const cdkVersion = '2.50.0';
const backend = new pj.awscdk.AwsCdkTypeScriptApp({
  defaultReleaseBranch: 'main',
  outdir: 'backend',
  parent: project,
  name: 'backend',
  cdkVersion,
  // release: true,
  tsconfig: {
    compilerOptions: {
      skipLibCheck: true,
    },
  },
});

backend.setScript('cdk', 'cdk');
backend.setScript('tsc', 'tsc');
backend.setScript('destroy', 'cdk destroy');
backend.setScript('postinstall', 'cd lambda && yarn install');
backend.setScript('deploy:no-approval', 'cdk deploy --require-approval never');

backend.setScript('buildReactApps', 'cd ../frontend && yarn build');

backend.synth();

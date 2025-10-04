import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import { cn } from '../../lib/utils';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        The <code>Easy API</code> enables you to effortlessly turn your account into an API, configure automations and integrations without writing any code.
      </>
    ),
  },
  {
    title: 'Reliable',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        @open-wa lets you focus on your docs, and we&apos;ll do the chores. Go
        ahead and move your docs into the <code>docs</code> directory.
      </>
    ),
  },
  {
    title: 'First Class Integrations',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Never worry about integrating with any other library again. We have a full suite of integrations for you from Chatwoot to Node Red. From S3 to Twillio.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text-center m-auto">
        <Svg className={cn(styles.featureSvg, 'text-center center m-auto')} role="img" />
      </div>
      <div className="text-center padding-horiz--md m-auto">
        <Heading as="h3" className='text-xl'>{title}</Heading>
        <p>{description}</p>
        <div>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

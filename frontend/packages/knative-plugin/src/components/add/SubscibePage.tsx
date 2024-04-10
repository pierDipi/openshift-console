import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  EVENT_TYPE_NAME_PARAM,
  EVENT_TYPE_NAMESPACE_PARAM,
  SUBSCRIBE_PROVIDER_API_VERSION_PARAM,
  SUBSCRIBE_PROVIDER_KIND_PARAM,
  SUBSCRIBE_PROVIDER_NAME_PARAM,
} from '../../const';
import { EventingEventTypeModel } from '../../models';
import EventType from '../eventing/EventType';
import PubSub from '../pub-sub/PubSub';

const SubscribePage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const subscribeApiVersion = searchParams.get(SUBSCRIBE_PROVIDER_API_VERSION_PARAM);
  const subscribeKind = searchParams.get(SUBSCRIBE_PROVIDER_KIND_PARAM);
  const subscribeName = searchParams.get(SUBSCRIBE_PROVIDER_NAME_PARAM);
  const eventTypeName = searchParams.get(EVENT_TYPE_NAME_PARAM);
  const eventTypeNamespace = searchParams.get(EVENT_TYPE_NAMESPACE_PARAM);

  const source: K8sResourceKind = {
    kind: subscribeKind,
    apiVersion: subscribeApiVersion,
    metadata: {
      namespace,
      name: subscribeName,
    },
  };

  const [et, loaded] = useK8sGet<K8sResourceKind>(
    EventingEventTypeModel,
    eventTypeName,
    eventTypeNamespace,
  );

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('knative-plugin~Subscribe')}</title>
      </Helmet>
      <PageHeading title={t('knative-plugin~Subscribe')}>
        {t('knative-plugin~Subscribe to')} {subscribeApiVersion} {subscribeKind} {namespace}/
        {subscribeName}
      </PageHeading>
      {loaded ? <EventType eventType={et} /> : <LoadingBox />}
      <PubSub source={source} close={() => {}} cancel={() => {}} />
    </NamespacedPage>
  );
};

export default SubscribePage;

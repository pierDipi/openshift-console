import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  CatalogItem,
  CatalogItemDetailsProperty,
  ExtensionHook,
  useAccessReview,
} from '@console/dynamic-plugin-sdk';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useEventTypesData } from '../hooks/useEventTypesData';
import { EventingEventTypeModel, EventingBrokerModel } from '../models';
import { getEventSourceIcon } from '../utils/get-knative-icon';

const normalizeEventType = (eventType: K8sResourceKind, t: TFunction): CatalogItem => {
  const { kind } = EventingEventTypeModel;
  const iconUrl = getEventSourceIcon(kind) as string;

  const uid = `${eventType.metadata.namespace}-${eventType.metadata.name}`;

  const href = `/catalog/ns/${eventType.metadata.namespace}/events?subscribeid=${uid}`;

  const properties: CatalogItemDetailsProperty[] = [];
  if (eventType.spec.hasOwnProperty('source')) {
    properties.push({
      label: t('knative-plugin~Source'),
      value: eventType.spec.source,
    });
  }
  if (eventType.spec.hasOwnProperty('schema')) {
    properties.push({
      label: t('knative-plugin~Schema URL'),
      value: eventType.spec.schema,
    });
  }
  let provider: string = null;
  let providerNamespacedName: string = '';
  if (eventType.spec.hasOwnProperty('reference')) {
    provider = `${eventType.spec.reference.apiVersion} ${eventType.spec.reference.kind}`;
    if (
      eventType.spec.reference.hasOwnProperty('namespace') &&
      eventType.spec.reference.hasOwnProperty('name')
    ) {
      providerNamespacedName = `${eventType.spec.reference.namespace}/${eventType.spec.reference.name}`;
      provider += ` ${providerNamespacedName}`;
    }
  } else if (eventType.spec.hasOwnProperty('broker')) {
    providerNamespacedName = `${eventType.metadata.namespace}/${eventType.spec.broker}`;
    provider = `${EventingBrokerModel.apiGroup}/${EventingBrokerModel.apiVersion} ${EventingBrokerModel.kind} ${eventType.metadata.namespace}/${eventType.spec.broker}`;
  }

  return {
    uid,
    /* Add type and providerNamespacedName so that users can filter on name and namespace */
    name: `${eventType.spec.type} (${providerNamespacedName})`,
    description: eventType.spec.description,
    cta: { label: t('knative-plugin~Subscribe'), href },
    type: 'Events',
    icon: { url: iconUrl },
    creationTimestamp: eventType.metadata.creationTimestamp,
    details: {
      properties,
    },
    provider,
  };
};

const useEventTypeProvider: ExtensionHook<CatalogItem[]> = (): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [canGetEventType] = useAccessReview({
    group: EventingEventTypeModel.apiGroup,
    resource: EventingEventTypeModel.plural,
    verb: 'get',
    namespace: '',
  });
  const [canListEventType] = useAccessReview({
    group: EventingEventTypeModel.apiGroup,
    resource: EventingEventTypeModel.plural,
    verb: 'list',
    namespace: '',
  });
  const [canWatchEventType] = useAccessReview({
    group: EventingEventTypeModel.apiGroup,
    resource: EventingEventTypeModel.plural,
    verb: 'watch',
    namespace: '',
  });

  const [eventTypes, eventTypesLoaded, eventTypesLoadError] = useEventTypesData('' /* */);

  const normalized = React.useMemo(() => {
    if (!eventTypesLoaded || !canGetEventType || !canListEventType || !canWatchEventType) return [];

    return eventTypes.map((et) => normalizeEventType(et, t));
  }, [eventTypesLoaded, eventTypes, canGetEventType, canListEventType, canWatchEventType, t]);
  return [normalized, eventTypesLoaded, eventTypesLoadError];
};

export default useEventTypeProvider;

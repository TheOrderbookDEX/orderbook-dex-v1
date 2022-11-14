import { TestSetupAction, TestSetupActionProperties } from '@frugal-wizard/contract-test-helper';
import { OrderbookFactoryContext } from '../scenario/OrderbookFactory';

export type OrderbookFactoryActionProperties = TestSetupActionProperties;

export abstract class OrderbookFactoryAction extends TestSetupAction<OrderbookFactoryContext> {
}

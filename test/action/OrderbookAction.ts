import { TestSetupAction, TestSetupActionProperties } from '@theorderbookdex/contract-test-helper';
import { OrderbookContext } from '../scenario/OrderbookScenario';

export type OrderbookActionProperties = TestSetupActionProperties;

export abstract class OrderbookAction extends TestSetupAction<OrderbookContext> {
}

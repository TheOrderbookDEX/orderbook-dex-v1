import { TestSetupAction, TestSetupActionProperties } from 'contract-test-helper';
import { OrderbookReentrancyContext } from '../scenario/OrderbookReentrancyScenario';

export type ReentrancyActionProperties = TestSetupActionProperties;

export abstract class ReentrancyAction extends TestSetupAction<OrderbookReentrancyContext> {
    abstract approve(ctx: OrderbookReentrancyContext): Promise<void>;
    abstract encode(): string;
}

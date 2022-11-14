import { TestSetupAction, TestSetupActionProperties } from '@frugal-wizard/contract-test-helper';
import { ReentrancyContext } from '../scenario/Reentrancy';

export type ReentrancyActionProperties = TestSetupActionProperties;

export abstract class ReentrancyAction extends TestSetupAction<ReentrancyContext> {
    abstract approve(ctx: ReentrancyContext): Promise<void>;
    abstract encode(): string;
}

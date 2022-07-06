import { TestSetupAction, TestSetupActionProperties } from 'contract-test-helper';
import { OperatorContext } from '../scenario/OperatorScenario';

export type OperatorActionProperties = TestSetupActionProperties;

export abstract class OperatorAction extends TestSetupAction<OperatorContext> {
}

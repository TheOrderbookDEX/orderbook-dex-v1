import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { transferOrderScenarios } from './scenarios/transferOrder';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('transferOrder', () => {
    for (const [ description, scenarios ] of Object.entries(transferOrderScenarios)) {
        describe(description, () => {
            for (const scenario of scenarios) {
                scenario.describe(({ it }) => {
                    if (scenario.expectedError) {
                        it('should fail', async (test) => {
                            await expect(test.execute())
                                .to.be.rejected;
                        });

                        it(`should fail with ${scenario.expectedError.name}`, async (test) => {
                            await expect(test.executeStatic())
                                .to.be.rejected.and.eventually.be.deep.equal(scenario.expectedError);
                        });

                    } else {
                        it('should update the order owner', async (test) => {
                            const { orderType, price, orderId } = scenario;
                            const { orderbook, addressBook, [scenario.newOwner]: newOwner } = test;
                            await test.execute();
                            expect((await orderbook.order(orderType, price, orderId)).owner)
                                .to.be.equal(await addressBook.id(newOwner));
                        });
                    }
                });
            }
        });
    }
});

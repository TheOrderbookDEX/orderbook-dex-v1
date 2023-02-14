import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { claimFeesScenarios } from './scenarios/claimFees';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('claimFees', () => {
    for (const [ description, scenarios ] of Object.entries(claimFeesScenarios)) {
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
                        it(`should decrease tradedToken balance of contract accordingly`, async (test) => {
                            const { orderbook, tradedToken } = test;
                            const [ collectedTradedToken ] = await orderbook.collectedFees();
                            const expected = await tradedToken.balanceOf(orderbook) - collectedTradedToken;
                            await test.execute();
                            expect(await tradedToken.balanceOf(orderbook))
                                .to.be.equal(expected);
                        });

                        it(`should increase tradedToken balance of treasury accordingly`, async (test) => {
                            const { orderbook, tradedToken, treasury } = test;
                            const [ collectedTradedToken ] = await orderbook.collectedFees();
                            const expected = await tradedToken.balanceOf(treasury) + collectedTradedToken;
                            await test.execute();
                            expect(await tradedToken.balanceOf(treasury))
                                .to.be.equal(expected);
                        });

                        it(`should decrease baseToken balance of contract accordingly`, async (test) => {
                            const { orderbook, baseToken } = test;
                            const [ , collectedBaseToken ] = await orderbook.collectedFees();
                            const expected = await baseToken.balanceOf(orderbook) - collectedBaseToken;
                            await test.execute();
                            expect(await baseToken.balanceOf(orderbook))
                                .to.be.equal(expected);
                        });

                        it(`should increase baseToken balance of treasury accordingly`, async (test) => {
                            const { orderbook, baseToken, treasury } = test;
                            const [ , collectedBaseToken ] = await orderbook.collectedFees();
                            const expected = await baseToken.balanceOf(treasury) + collectedBaseToken;
                            await test.execute();
                            expect(await baseToken.balanceOf(treasury))
                                .to.be.equal(expected);
                        });

                        it(`should set collected fees to zero`, async (test) => {
                            const { orderbook } = test;
                            await test.execute();
                            expect(await orderbook.collectedFees())
                                .to.be.deep.equal([ 0n, 0n ]);
                        });
                    }
                });
            }
        });
    }
});

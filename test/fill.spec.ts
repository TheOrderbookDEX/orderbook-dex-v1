import { DefaultOverrides } from '@frugalwizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { is } from '@frugalwizard/contract-test-helper';
import { fillScenarios } from './scenarios/fill';
import { Filled } from '../src/OrderbookV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

// TODO test overflows/underflows

describe('fill', () => {
    for (const [ description, scenarios ] of Object.entries(fillScenarios)) {
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
                        it('should return the amount of contracts filled', async (test) => {
                            const [ totalFilled ] = await test.executeStatic();
                            expect(totalFilled)
                                .to.be.equal(scenario.totalFilled);
                        });

                        it('should return the total price of the contracts filled', async (test) => {
                            const [ , totalPrice ] = await test.executeStatic();
                            expect(totalPrice)
                                .to.be.equal(scenario.totalPrice);
                        });

                        it('should return the fee collected', async (test) => {
                            const [ , , fee ] = await test.executeStatic();
                            expect(fee)
                                .to.be.equal(scenario.collectedFee);
                        });

                        it(`should decrease ${scenario.takenToken} balance of caller accordingly`, async (test) => {
                            const { takenAmount } = scenario;
                            const { mainAccount, [scenario.takenToken]: takenToken } = test;
                            const expected = await takenToken.balanceOf(mainAccount) - takenAmount;
                            await test.execute();
                            expect(await takenToken.balanceOf(mainAccount))
                                .to.be.equal(expected);
                        });

                        it(`should increase ${scenario.takenToken} balance of contract accordingly`, async (test) => {
                            const { takenAmount } = scenario;
                            const { orderbook, [scenario.takenToken]: takenToken } = test;
                            const expected = await takenToken.balanceOf(orderbook) + takenAmount;
                            await test.execute();
                            expect(await takenToken.balanceOf(orderbook))
                                .to.be.equal(expected);
                        });

                        it(`should decrease ${scenario.givenToken} balance of contract accordingly`, async (test) => {
                            const { givenAmount, collectedFee } = scenario;
                            const { orderbook, [scenario.givenToken]: givenToken } = test;
                            const expected = await givenToken.balanceOf(orderbook) - (givenAmount - collectedFee);
                            await test.execute();
                            expect(await givenToken.balanceOf(orderbook))
                                .to.be.equal(expected);
                        });

                        it(`should increase ${scenario.givenToken} balance of caller accordingly`, async (test) => {
                            const { givenAmount, collectedFee } = scenario;
                            const { mainAccount, [scenario.givenToken]: givenToken } = test;
                            const expected = await givenToken.balanceOf(mainAccount) + (givenAmount - collectedFee);
                            await test.execute();
                            expect(await givenToken.balanceOf(mainAccount))
                                .to.be.equal(expected);
                        });

                        it(`should increase collected fees accordingly`, async (test) => {
                            const { givenToken, collectedFee } = scenario;
                            const { orderbook } = test;
                            let [ collectedTradedToken, collectedBaseToken ] = await orderbook.collectedFees();
                            switch (givenToken) {
                                case 'tradedToken':
                                    collectedTradedToken += collectedFee;
                                    break;
                                case 'baseToken':
                                    collectedBaseToken += collectedFee;
                                    break;
                            }
                            await test.execute();
                            expect(await orderbook.collectedFees())
                                .to.be.deep.equal([ collectedTradedToken, collectedBaseToken ]);
                        });

                        it('should not change total placed contracts', async (test) => {
                            const { orderType, filledAmounts } = scenario;
                            const { orderbook } = test;
                            const expected = new Map();
                            for (const price of filledAmounts.keys()) {
                                expected.set(price, (await orderbook.pricePoint(orderType, price)).totalPlaced);
                            }
                            await test.execute();
                            for (const [ price, amount ] of expected.entries()) {
                                expect((await orderbook.pricePoint(orderType, price)).totalPlaced)
                                    .to.be.equal(amount);
                            }
                        });

                        it('should increase total filled contracts accordingly', async (test) => {
                            const { orderType, filledAmounts } = scenario;
                            const { orderbook } = test;
                            const expected = new Map();
                            for (const [ price, amount ] of filledAmounts.entries()) {
                                expected.set(price, (await orderbook.pricePoint(orderType, price)).totalFilled + amount);
                            }
                            await test.execute();
                            for (const [ price, amount ] of expected.entries()) {
                                expect((await orderbook.pricePoint(orderType, price)).totalFilled)
                                    .to.be.equal(amount);
                            }
                        });

                        it(`should update ${scenario.bestPrice} accordingly`, async (test) => {
                            await test.execute();
                            const { orderbook } = test;
                            expect(await orderbook[scenario.bestPrice]())
                                .to.be.equal(scenario.expectedBestPrice);
                        });

                        it('should emit Filled', async (test) => {
                            const { orderType, filledAmounts } = scenario;
                            const { events } = await test.execute();
                            const filledEvents = events.filter(is(Filled));
                            expect(filledEvents)
                                .to.have.length(filledAmounts.size);
                            expect(filledEvents.map(({ price }) => price))
                                .to.have.members([...filledAmounts.keys()])
                            for (const event of filledEvents) {
                                expect(event.orderType)
                                    .to.be.equal(orderType);
                                expect(event.amount)
                                    .to.be.equal(filledAmounts.get(event.price));
                            }
                        });
                    }
                });
            }
        });
    }
});

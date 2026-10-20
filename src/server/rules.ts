/** Reputation and credit economy. Kept in one place so the rules are easy to explain and tune. */
export const RULES = {
  startingCredits: 5,
  reputation: {
    questionUpvote: 5,
    answerUpvote: 10,
    downvote: -2,
    answerAccepted: 15,
    acceptingAnswer: 2,
  },
  credits: {
    answerAccepted: 2,
  },
  helpSession: {
    minCredits: 1,
    maxCredits: 10,
  },
} as const;

export type EntityType = "question" | "answer";

/** Reputation change for the content author when a vote moves from `oldValue` to `newValue` (each -1, 0 or 1). */
export function reputationDelta(entity: EntityType, oldValue: number, newValue: number): number {
  const up = entity === "question" ? RULES.reputation.questionUpvote : RULES.reputation.answerUpvote;
  const worth = (v: number) => (v > 0 ? up : v < 0 ? RULES.reputation.downvote : 0);
  return worth(newValue) - worth(oldValue);
}

---
title: "Your Meta Muse consent does not cover me"
date: "2026-10-21"
topics: [ai, privacy]
description: "Meta says Muse is private, secure and free. Its own policy says the agent can collect information about other people from your inbox, calendar and connected accounts. Those people never agreed to the bargain."
draft: true
---

I was listening to the Syntax crew discuss Meta Muse, Meta's new personal AI
agent. Wes Bos was impressed by the engineering and the price: a persistent
Linux VM, connectors, subagents and automation, free for ordinary users. Scott
Tolinski wanted nothing to do with it.

> I don't want my friends and family getting all their stuff scooped up by this
> machine.

That comes at [12:54 in the segment](https://www.youtube.com/watch?v=Z412bnUNiDI&t=774s),
and it is the part I cannot get past.[1]

One response on the show was that privacy-conscious developers are beside the
point. Muse is not for them. It is for regular people, who already use Facebook
and generally do not care enough about data collection to leave.

That answer would be weak even if Muse only collected data about its user. It
doesn't. A personal agent becomes useful by reading the places where other
people have spoken to you: email, messages, calendars, documents, photographs,
health services and social accounts. Your decision to connect an inbox is also
a decision about every person in it.

<!--
Article illustration: export ../meta-muse-consent-gap.excalidraw and upload the
rendered image to R2 before publication. Suggested placement: here. Alt text:
"Diagram showing friends, family, children, colleagues and clients contributing
private data to one person's connected accounts; that person alone clicks Allow,
after which data enters the Muse VM, operational logs and default-on model
training. The non-users receive no consent screen, settings or product."
-->

"It's not for you" stops making sense when the product is ingesting your
messages anyway.

## The consent screen has the wrong person on it

Meta's Muse privacy policy is unusually explicit about the scope. It says Muse
collects prompts, responses and information pulled from connected services,
including text, voice, photos and "information about you or others." It stores
files, goals, memories and scheduled tasks. Connector data used for a task
becomes part of the user's interaction history.[2]

That last category is where the neat model of individual consent falls apart.

My email contains medical details sent by family members. My calendar names
children, schools and appointments. Messages contain addresses, arguments,
financial arrangements, private jokes and the sort of half-finished thoughts
people share because they think they are talking to one person. None of those
people clicked Meta's consent screen. They cannot inspect the permissions. They
cannot turn off training. They may not even know an agent is reading.

Meta says users can disconnect a connector, but information already used may
remain in Muse's memory and conversation history. Deleting a message may also
leave behind information Muse learned from it; the policy says the agent will
"forget" on request "to the best of its ability."[2][6]

Whose request? The account holder's. Not mine, even when the fact being
remembered is about me.

## The training switch starts in the wrong position

Muse can use interactions to improve Meta's AI models. That switch is on when a
person first uses the product. The user can turn it off, and Meta says changing
the setting also applies to previous interactions.[2]

Meta also says it removes certain identifiers and disassociates interactions
from the account before training. That is better than doing neither. It still
means the default is that a new user can contribute connector-derived
information about other people to model development before those people know
Muse exists.[2]

This is not a theoretical edge case. Meta markets Muse as an agent that
remembers friends' dietary restrictions, sends invitations, negotiates, reads
email and works across the apps people use every day.[5] The product's value
comes from turning a social life into context. The people who generated that
context receive no product, no settings and no say.

## Secure is not the same as private

Meta has done serious security engineering here. Muse runs in an isolated VM.
Credentials sit outside the agent runtime. A separate Sentinel controls network
access and connector actions. Meta labels external data as untrusted and runs
prompt-injection classifiers. These are meaningful controls, not a decorative
padlock in a launch video.[3]

They answer one question: how difficult is it for the agent or an attacker to
misuse its access?

They do not answer the question Scott raised: should Meta receive this much
access in the first place?

Meta says Muse conversations and VM data are not shared with its advertising
systems.[2] Good. Meta also says the current architecture does not prevent Meta
from accessing VM data when necessary to support, secure or operate the
service. A future "Confidential VM" is intended to make that impossible, but it
is not the current product.[3]

Private from the ad auction is not private from the service provider. Isolated
from other users is not isolated from Meta. A well-secured pipeline can still
carry far too much information.

## The terms put the risk back on the user

Muse can communicate, transact and alter data. Meta's supplemental terms say
its actions can be wrong even when they look detailed and convincing, and that
the user remains solely responsible for the resulting decisions, actions and
outcomes. Meta reserves the right to monitor, log, review, block or modify
Muse's actions and retain action logs. For unintended or unauthorized actions,
its aggregate liability is generally capped at the greater of $250 or what the
user paid during the preceding twelve months, except where local law or Meta's
gross negligence, willful misconduct or fraud changes that result.[4]

That is a remarkable allocation of responsibility for a product marketed as
something that "actually does the work."[5]

Meta gets the connected context and the right to process and supervise the
service. The user gets an agent that may act incorrectly and an obligation to
review it. Everyone represented inside the connected data gets neither a
contract nor a control panel.

## "User error" is part of the product

During the Syntax discussion, the hosts mention a Facebook Marketplace user
whose Muse accepted an offer, gave a buyer his home address and sent "Yep, I'm
here!" while he was away. The buyer arrived at the building. The user had
selected an "always allow" permission and had supplied the address, but expected
Muse to ask before accepting an offer or arranging pickup.[1][8]

Calling that user error does not rescue the design. Meta says Muse is built for
billions of people with "no learning curve" and no technical experience
required.[5] If a predictable reading of an ordinary permission produces a
stranger at someone's home, the permission is badly shaped for the audience.
The product cannot be simultaneously effortless enough for everyone and safe
only when configured by someone who understands agent scopes, prompt injection
and least privilege.

A separate October failure made 6,800 user-created Muse share links discoverable
through passive DNS. Researchers opened a few hundred and found executive-search
notes, revenue figures, a loan application, property addresses and a staff
vacation calendar. Meta paused the sharing feature while reviewing the report.[7]

Those users chose to create share links. They did not choose to publish them in
a searchable directory. The distinction between authorization and informed
expectation matters. Muse keeps finding ways to demonstrate it.

## My objection is not "Meta bad"

I run personal agents. I understand why a connected agent is dramatically more
useful than a chatbot in a blank window. I also understand that any agent able
to read private data and communicate externally has a dangerous combination of
capabilities. Meta itself describes this as the "lethal trifecta" and says
prompt injection remains an open problem.[3]

The objection is narrower and harder to dismiss:

**One person cannot consent on behalf of everyone in their digital life.**

An inbox is not an individual dataset. A family calendar is not an individual
dataset. A camera pointed into a home is not an individual dataset. Personal AI
agents are built around information that is relational by nature, while their
privacy controls pretend the account holder owns it alone.

If Meta wants Muse to be a product for regular people, it needs defaults that
respect the people who never installed it:

- Training should be off by default, especially for connector-derived data.
- The product should visibly distinguish human messages from agent messages.
- Sensitive facts about third parties should not become durable memory without
  a separate, explicit action.
- Permission screens should show examples of what a grant permits, including
  disclosure to another human, rather than hiding behind "always allow."
- Disconnecting a service should offer a verifiable purge of data learned from
  that connector.
- The Confidential VM should be the baseline, not a future premium-shaped
  answer to a problem the launch version already has.

Until then, I do not merely choose not to use Muse. I do not want people around
me feeding it our conversations, family details and shared history either.
Their convenience does not supply my consent.

## Sources

[1] Syntax Weekly: Meta Muse segment — https://www.youtube.com/watch?v=Z412bnUNiDI
[2] Muse Privacy Policy — https://muse.ai/privacy
[3] Meta: How We Built Safety Into Muse — https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse
[4] Muse Supplemental Terms of Service — https://muse.ai/terms
[5] Meta: Introducing Muse — https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent
[6] Meta: How Muse works with Connectors — https://www.meta.com/help/artificial-intelligence/1687253048996149
[7] Ars Technica: Muse share links exposed sensitive data — https://arstechnica.com/security/2026/10/meta-muse-exposes-users-personal-and-business-secrets-when-they-share-conversations?view=full
[8] Fortune/AP: Meta Muse sent a Marketplace buyer to a user's home — https://fortune.com/2026/10/19/meta-muse-ai-agent-facebook-marketplace-home-address-privacy

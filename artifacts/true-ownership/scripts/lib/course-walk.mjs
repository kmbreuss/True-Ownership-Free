// The whole Yes path of the free course, shared by the mocked walk (Mac) and the real free-path test (Replit).
// `shot(name)` is optional; `saveDownload(download)` receives the FC-18 poster. Returns the saved answer after the poster.
export async function walkYesPath(page, { shot = async () => {}, errors = [], saveDownload = async () => {} } = {}) {
  const click = text => page.getByRole("button", { name: text, exact: true }).click();
  await click("Begin the Reality Check →");
  await page.locator(".fc-bar").waitFor(); await page.waitForTimeout(2900);
  await shot("FC-01"); await click("I'm ready →");
  await page.getByText("Owning your life isn't about control.").waitFor(); await shot("FC-02"); await click("Show me where →");
  await page.getByRole("button", { name: /^Time/ }).click(); await shot("FC-03"); await click("This one →");
  await page.getByLabel("Your ordinary Tuesday", { exact: true }).fill("Every day ends with the thing I meant to do still waiting.");
  await shot("Tuesday"); await click("Show me the price →");
  await page.getByRole("button", { name: "$500", exact: true }).click();
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByLabel("Where does the money go?").fill("work I turn down, help I don't hire");
  await page.getByLabel("Where do the hours go?").fill("doing what someone else could do");
  await page.getByLabel("What is it costing you?").fill("“I'm short with my kids by six o'clock.”");
  await page.locator(".fc-scroll").evaluate(el => { el.scrollTop = 0; }); await shot("FC-04");
  await click("Keep going →");
  await page.getByText("Life is a mirror.").waitFor(); await shot("FC-05"); await click("Show me mine →");
  for (const id of ["time-carrying", "time-carrying-2", "time-carrying-3", "time-hoping"]) await page.locator(`[data-mirror-id="${id}"]`).click();
  await shot("FC-06"); await click("Show me what I see →");
  await page.getByText("You lean toward").first().waitFor(); await shot("FC-07"); await click("Look underneath →");
  await page.getByLabel("The one thing I've been carrying").fill("Every client problem, even the ones my team could handle.");
  await shot("FC-08"); await click("That's it →");
  await page.getByRole("button", { name: "Guilt", exact: true }).click(); await shot("FC-09"); await click("Keep going →");
  await page.getByText("Guilt has been protecting you.").waitFor(); await shot("FC-10"); await click("Look beyond it →");
  await page.getByText("It's time to look beyond it.").waitFor(); await shot("FC-11"); await click("Ask it →");
  await page.getByLabel("The part I own is").fill("I don't let my team try first. I step in before they can.");
  await shot("FC-12"); await click("See where it leads →");
  await page.getByText("Now close your eyes.").waitFor(); await page.waitForTimeout(400); await shot("Eyes");
  await page.getByText("Imagine nothing changes.").waitFor();
  await click("Show me →");
  await page.getByText("Future A · the same path").waitFor();
  await page.getByLabel("What's still the same in one month?").fill("Still saying yes to every call. Still the last one out.");
  await page.getByLabel("What's still the same in one year?").fill("The team still waits for me. I'm short with the kids by six.");
  await page.getByLabel("What's still the same in three years?").fill("Same desk. Same problems. The kids stopped asking me to come.");
  await page.getByText("−40 hours · −$500").waitFor(); await page.getByText("−520 hours · −$6,000").waitFor(); await page.getByText("−1,560 hours · −$18,000").waitFor();
  await shot("FC-13"); await click("Now turn around →");
  await page.getByText("Future B isn't escaping something.").waitFor(); await page.waitForTimeout(300); await shot("FC-14"); await click("Show me →");
  await page.getByLabel("What are you doing instead in one month?").fill("I let my team take the first call. Home by five, twice a week.");
  await page.getByLabel("What are you doing instead in one year?").fill("My team handles the client calls. Coffee before anyone needs me.");
  await page.getByLabel("What are you doing instead in three years?").fill("Building the work I love. The kids know they come first.");
  await page.getByText("+40 hours · +$500").waitFor(); await page.getByText("+520 hours · +$6,000").waitFor(); await page.getByText("+1,560 hours · +$18,000").waitFor();
  await shot("FC-15"); await click("Picture it →");
  const picks = ["Coffee before anyone needs me", "My team takes the first call", "Home in time for what matters", "People who know the real me", "I check my account without dread"];
  for (let n = 0; n < 5; n++) {
    await page.getByRole("button", { name: picks[n], exact: true }).click();
    if (n === 0) await shot("FC-16");
    if (n === 4) await shot("FC-16-money");
    await page.getByRole("button", { name: /^(Next · .*|Show me) →$/ }).click();
  }
  for (const f of ["Calm", "Trusted", "Free"]) await page.getByRole("button", { name: f, exact: true }).click();
  await shot("FC-16-feels"); await click("Show me →");
  await page.getByText("This is what owning your part looks like.").waitFor(); await page.waitForTimeout(200); await shot("FC-17"); await click("Choose my future →");
  await page.getByLabel(/What will you be doing by next/).fill("I have time to think and enough left for myself.");
  await page.getByLabel("My one thing this week", { exact: true }).fill("let my team take Thursday's client call.");
  await page.getByText("The thing you chose to start comes with you when your road opens.").waitFor();
  await shot("Letter"); await click("Choose my future →");
  await page.getByText("Which future are you building?").waitFor(); await shot("Choose");
  // Future A: an honest answer, then back to FC-17.
  await page.locator(".rc-choose-a").click(); await page.getByRole("heading", { name: "That's an honest answer." }).waitFor();
  await click("Look at Future B again →"); await page.getByText("This is what owning your part looks like.").waitFor();
  await click("Choose my future →"); await click("Choose my future →");
  await page.locator(".rc-choose-b").click(); await page.getByText(/Are you willing to do what it takes/).waitFor(); await shot("Willing");
  await page.getByRole("button", { name: "Yes, I'm willing" }).click();
  await page.getByText("You're moving toward something now.").waitFor(); await page.waitForTimeout(2300); await shot("FC-18");
  const download = page.waitForEvent("download");
  await click("Save my Future B");
  const dl = await Promise.race([download, page.waitForTimeout(8000).then(async () => { throw new Error("No poster download. Alerts: " + JSON.stringify(await page.locator("[role=alert]").allInnerTexts()) + " errors: " + JSON.stringify(errors)); })]);
  await saveDownload(dl);
  const final = await page.evaluate(() => JSON.parse(localStorage.getItem("to_rc_state_v1")));
  // FC-18 on to the waitlist: FC-19, FC-20, FC-21, then the existing ending.
  await click("Where to next →"); await page.getByText("Decades of my own life").waitFor(); await shot("FC-19");
  await click("Show me the five →"); await page.getByText("Five parts of your operating system.").waitFor(); await shot("FC-20");
  await click("What I get →"); await page.getByText("Here's what you get when you own it.").waitFor(); await shot("FC-21");
  await click("Join the waitlist →");
  await page.getByText("On the waitlist ✓", { exact: true }).waitFor(); await page.getByText("You're on the list.").waitFor(); await shot("Ending");
  // The course ending does not repeat the road list that FC-20 just showed.
  if (await page.locator(".free-ending .free-road-ahead").count() !== 0) throw new Error("The waitlist ending repeats the road-ahead list.");
  for (const t of ["YOU CHOSE FUTURE B", "Willpower won't get you there. This will."]) await page.getByText(t, { exact: true }).waitFor();
  return final;
}

// Fix round I (the outside QA pass, F2; POLISH.md 82): the beach below the falls is never Wren's mark. Shut in, it's only
// reached by riding the ferry over the falls, and stepping ashore used to make it her mark, so falling in (the bottle's
// own advice: "went home the quick way") only brought her back to it. Now a fall in takes her home to where she was
// before the ride; a save made on the beach loads with that mark kept, and one made before (the beach its mark) with home
// at the end of the road by the ferry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SAVES = JSON.parse(fs.readFileSync(path.join(ROOT, 'qa_kit', 'saves', 'save_states.json'), 'utf8'));
const code = id => SAVES.find(s => s.id === id).code;
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const step = (HW, d) => { HW.hold(d); HW.step(16); HW.release(); HW.step(4); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const load = c => { const HW = loadGame(); HW.global('Game').load(HW.Save.fromCode(c)); HW.step(40); HW.skipTalk(); return HW; };
const at = HW => [HW.player().tx, HW.player().ty];
const mark = HW => [HW.player().mark.tx, HW.player().mark.ty];
/* the tester's code (evidence F2-beach-before-dive.txt): saved on the beach after the ride from T18, the beach its mark */
const BEACH = 'HW1:eyJ2IjoxLCJnYW1lIjoiaG9sbG93ZWxsIiwidmVyc2lvbiI6IjAuMS4wIiwic2F2ZWRBdCI6MTc5NDUyMjg5MTc5OSwibmFtZSI6IldyZW4iLCJpbnYiOnsiaHAiOjEyLCJtYXhIcCI6MTIsImJ1dHRvbnMiOjAsInRvb2xzIjpbImdsb3ZlcyIsImhvb2siLCJwYWRkbGUiXSwiZXF1aXBwZWQiOiJwYWRkbGUiLCJrZXlDb3VudCI6eyJ0aWR5IjowLCJraWxuIjowLCJtaWxsIjoxfSwicGF0dGVybnMiOlsidGlkeSIsImtpbG4iLCJtaWxsIl0sInBsYW5zIjpbInRpZHkiLCJtaWxsIl0sImtub3RzIjpbInRpZHkiLCJraWxuIiwibWlsbCJdLCJwYXRjaGVzIjowLCJwYXRjaElkcyI6W10sIml0ZW1zIjp7InN0YWZmIjoxfSwiYmVkcm9sbCI6bnVsbCwic3RpdGNoZXMiOltdfSwicHJvZ3Jlc3MiOnsiZmxhZ3MiOnsidmlzaXRlZDpncmFuX3Jvb20iOnRydWUsInZpc2l0ZWQ6Z3Jhbl9ob3VzZSI6dHJ1ZSwidGFsa2VkR3JhbiI6dHJ1ZSwidmlzaXRlZDpob2xsb3ciOnRydWUsImNlcmVtb255Ijp0cnVlLCJ2aXNpdGVkOnRpZHkiOnRydWUsInRpZHlfZk4iOnRydWUsInRpZHlfa0tleSI6dHJ1ZSwidG9sZDprZXkiOnRydWUsInBpZSI6dHJ1ZSwidGlkeV9mRSI6dHJ1ZSwidGlkeV9nRyI6dHJ1ZSwidGlkeV9nUGxhbiI6dHJ1ZSwidG9sZDpwbGFuIjp0cnVlLCJ0aWR5X3BHIjp0cnVlLCJ0aWR5X3BLZXkiOnRydWUsInRpZHlfaEUiOnRydWUsInRpZHlfcE4iOnRydWUsInRpZHlfbW9uZ2VyIjp0cnVlLCJ0aWR5X2dsb3ZlcyI6dHJ1ZSwiZ290R2xvdmVzIjp0cnVlLCJ0aWR5X2xLZXkiOnRydWUsInRpZHlfaE4iOnRydWUsInRpZHlfYmFsbERvbmUiOnRydWUsInRpZHlfcGF0dGVybiI6dHJ1ZSwidG9sZDpwYXR0ZXJuIjp0cnVlLCJ0aWR5X3Nob3J0Y3V0Ijp0cnVlLCJ0aWR5X2xOIjp0cnVlLCJ0aWR5X2Jvc3NEb29yIjp0cnVlLCJ0aWR5X2Jvc3MiOnRydWUsInRpZHlfa25vdCI6dHJ1ZSwiZDEiOnRydWUsImtpbG5QYXNzIjp0cnVlLCJ2aXNpdGVkOmtpbG4iOnRydWUsImtpbG5fZUdhdGUiOnRydWUsImtpbG5fZUtleSI6dHJ1ZSwia2lsbl9oTiI6dHJ1ZSwia2lsbl9kS2V5Ijp0cnVlLCJraWxuX2hFIjp0cnVlLCJraWxuX3Ntc04iOnRydWUsImtpbG5fZ2xhemVyIjp0cnVlLCJraWxuX2hvb2tDaGVzdCI6dHJ1ZSwia2lsbl9iS2V5Ijp0cnVlLCJraWxuX2ZXIjp0cnVlLCJraWxuX2tQYXR0ZXJuIjp0cnVlLCJraWxuX2dOIjp0cnVlLCJraWxuX2tCb3NzIjp0cnVlLCJraWxuX2Jvc3MiOnRydWUsImtpbG5fa25vdCI6dHJ1ZSwiZDIiOnRydWUsInRhZ1N0b3BwZWQiOnRydWUsInZpc2l0ZWQ6bWlsbHJhY2UiOnRydWUsIm1pbGxyYWNlX3NuYXBqYXciOnRydWUsIm1pbGxyYWNlX3R3b1doZWVscyI6dHJ1ZSwibWlsbHJhY2VfYm9zcyI6dHJ1ZSwibWlsbF9rbm90Ijp0cnVlLCJkMyI6dHJ1ZSwia2V5c190dWciOnRydWUsInMwOCI6dHJ1ZSwiZ3MyIjp0cnVlfSwiYXJlYUZsYWdzIjp7InRpZHkiOnsiZG9vcjpmTiI6dHJ1ZSwiY2hlc3Q6a0tleSI6dHJ1ZSwiZG9vcjpmRSI6dHJ1ZSwiZG9vcjpnRyI6dHJ1ZSwiY2hlc3Q6Z1BsYW4iOnRydWUsImRvb3I6cEciOnRydWUsImNoZXN0OnBLZXkiOnRydWUsImRvb3I6aEUiOnRydWUsImRvb3I6cE4iOnRydWUsImNoZXN0Omdsb3ZlcyI6dHJ1ZSwiY2hlc3Q6bEtleSI6dHJ1ZSwiZG9vcjpoTiI6dHJ1ZSwiY2hlc3Q6cGF0dGVybiI6dHJ1ZSwibGV2ZXI6c2hvcnRjdXQiOnRydWUsImRvb3I6bE4iOnRydWUsImRvb3I6Ym9zc0Rvb3IiOnRydWUsImdvdDp0aWR5SGVhcnQiOnRydWV9LCJob2xsb3ciOnsiY2hhcm06ZmdIb2xlIjp0cnVlfSwia2lsbiI6eyJjaGFybTplQ2hhcm0iOnRydWUsImRvb3I6ZUdhdGUiOnRydWUsImNoZXN0OmVLZXkiOnRydWUsInNlYWw6ZVNlYWwiOnRydWUsImRvb3I6aE4iOnRydWUsImNoZXN0OmRLZXkiOnRydWUsImRvb3I6aEUiOnRydWUsInNlcTpzbXMiOnRydWUsImRvb3I6c21zTiI6dHJ1ZSwiY2hlc3Q6aG9va0NoZXN0Ijp0cnVlLCJjaGFybTpiQ2hhcm0iOnRydWUsImNoZXN0OmJLZXkiOnRydWUsImRvb3I6ZlciOnRydWUsImNoZXN0OmtQYXR0ZXJuIjp0cnVlLCJkb29yOmdOIjp0cnVlLCJkb29yOmtCb3NzIjp0cnVlLCJnb3Q6a2lsbkhlYXJ0Ijp0cnVlfSwibWlsbHJhY2UiOnsiZG9vcjp3aEdhdGUiOnRydWUsImNoZXN0OmZwS2V5Ijp0cnVlLCJjaGVzdDpid1BsYW4iOnRydWUsImNoZXN0OnNqUGFkZGxlIjp0cnVlLCJjaGVzdDp1cEtleSI6dHJ1ZSwiZG9vcjp1cExvY2tFIjp0cnVlLCJkb29yOnR3R2F0ZSI6dHJ1ZSwiZG9vcjpsa0dhdGUiOnRydWUsInNlcTpicnMiOnRydWUsImNoZXN0OmJyUGF0dGVybiI6dHJ1ZSwiZG9vcjpsa0JpZyI6dHJ1ZSwiZ290Om1pbGxIZWFydCI6dHJ1ZX19LCJub3RlcyI6WyJncmFuVHVuZSIsInMwOCJdLCJqb3VybmFsIjpbXSwiZ29hbCI6Ik5leHQsIEJlbGZyeSBIZWlnaHRzOiBhY3Jvc3MgdGhlIGxha2UgZnJvbSBNaWxsd2F0ZXIsIHVwIHRoZSBjbGlmZiBzdGFpci4gKFRoZSBQYWRkbGUgd2lsbCBnZXQgeW91IG92ZXIuKSJ9LCJzdGF0cyI6eyJjIjp7InRhbGx5IjoxLCJhZnQ6d2F0Y2giOjEsImFmdDprZXB0Q3V0cyI6MSwiYWZ0OmtlcHRXZWxsIjoxLCJpbnRlcmFjdGlvbnMiOjI0LCJibG93biI6Mjc3LCJkcmlmdHMiOjE2MTcsImhvbWVjb21pbmdzIjozMTMsInZlbnQ6ZmlyZWQiOjQ3LCJwdXNoZXMiOjIyLCJ0aHJvd3MiOjE2LCJzaGF0dGVycyI6MTUsInNlY3JldDpwaWUiOjEsImRlZmVhdGVkOm1vbmdlciI6MSwicHVsbHMiOjMsImJhbGw6aGVsZCI6MSwiYm9zczp0aWR5OnNsYW0iOjMsImNoYXJtcyI6MTksImJvc3M6Z2xhemVyOnNoYXJkcyI6MiwidG9vbDpob29rIjoxMiwiaG9vazpsYXRjaCI6OSwia25vY2tzIjoxLCJib3NzOmtpbG46ZGFydCI6MSwiYm9zczpraWxuOnNoYXJkcyI6MywiYm9zczpraWxuOmdsb2IiOjMsImJvc3M6a2lsbjpzaGVkIjoxLCJob29rOnB1bGwiOjMsImJvc3M6c25hcGphdzpib25rIjoyLCJwYWRkbGVzIjoyMywiYm9zczpncmluZGxlOnNwaXQiOjMsImJvc3M6Z3JpbmRsZTpndWxwIjoyLCJmZXJyeWJlbGwiOjEsInN3aW5ncyI6MiwiYm9zczpncmluZGxlOmhpdCI6MywiYm9zczpncmluZGxlOnR1cm4iOjIsImJvc3M6Z3JpbmRsZTp3YXNoIjoxLCJib3NzOmdyaW5kbGU6cml2ZXRzIjoxLCJzZWNyZXQ6a2V5cyI6MX0sInJvb21zIjp7ImdyYW5fcm9vbTowIjp7InQiOjYwOCwidmlzaXRzIjoxLCJudWRnZXMiOjB9LCJncmFuX2hvdXNlOjAiOnsidCI6NDc1LCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH0sImhvbGxvdzowIjp7InQiOjcyODYsInZpc2l0cyI6NywibnVkZ2VzIjowfSwidGlkeTowIjp7InQiOjEyMTUsInZpc2l0cyI6NCwibnVkZ2VzIjowfSwidGlkeTozIjp7InQiOjE1MDQsInZpc2l0cyI6NCwibnVkZ2VzIjowfSwidGlkeToxIjp7InQiOjExMTAsInZpc2l0cyI6MSwibnVkZ2VzIjowfSwidGlkeToyIjp7InQiOjEyODIsInZpc2l0cyI6MSwibnVkZ2VzIjowfSwidGlkeTo0Ijp7InQiOjU3OCwidmlzaXRzIjoxLCJudWRnZXMiOjB9LCJ0aWR5OjUiOnsidCI6MTI2OCwidmlzaXRzIjoyLCJudWRnZXMiOjB9LCJ0aWR5OjciOnsidCI6MTQ1MSwidmlzaXRzIjozLCJudWRnZXMiOjB9LCJ0aWR5OjgiOnsidCI6OTE2LCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH0sInRpZHk6OSI6eyJ0IjoxMjY2LCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH0sInRpZHk6MTIiOnsidCI6MjMzLCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH0sInRpZHk6MTMiOnsidCI6MjE2MywidmlzaXRzIjoxLCJudWRnZXMiOjB9LCJraWxuOjAiOnsidCI6MTA1OSwidmlzaXRzIjoxLCJudWRnZXMiOjB9LCJraWxuOjIiOnsidCI6MTcxMCwidmlzaXRzIjo0LCJudWRnZXMiOjB9LCJraWxuOjkiOnsidCI6NjQwLCJ2aXNpdHMiOjMsIm51ZGdlcyI6MH0sImtpbG46NSI6eyJ0IjoxMjk0LCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH0sImtpbG46NCI6eyJ0IjoxNDY3LCJ2aXNpdHMiOjIsIm51ZGdlcyI6MH0sImtpbG46NiI6eyJ0IjoxMDUxLCJ2aXNpdHMiOjMsIm51ZGdlcyI6MH0sImtpbG46NyI6eyJ0Ijo4MDAsInZpc2l0cyI6MiwibnVkZ2VzIjowfSwia2lsbjo4Ijp7InQiOjkwMSwidmlzaXRzIjoxLCJudWRnZXMiOjB9LCJraWxuOjEwIjp7InQiOjE0MzksInZpc2l0cyI6MSwibnVkZ2VzIjowfSwia2lsbjoxMiI6eyJ0IjoyMzMsInZpc2l0cyI6MSwibnVkZ2VzIjowfSwia2lsbjoxMyI6eyJ0IjoyNTg5LCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH0sIm1pbGxyYWNlOjAiOnsidCI6MTQ0OCwidmlzaXRzIjo0LCJudWRnZXMiOjB9LCJtaWxscmFjZTozIjp7InQiOjIzMDMsInZpc2l0cyI6MywibnVkZ2VzIjowfSwibWlsbHJhY2U6MSI6eyJ0IjoxNzYxLCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH0sIm1pbGxyYWNlOjIiOnsidCI6NzIwLCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH0sIm1pbGxyYWNlOjUiOnsidCI6MTI2MywidmlzaXRzIjoxLCJudWRnZXMiOjB9LCJtaWxscmFjZTo2Ijp7InQiOjUxOSwidmlzaXRzIjoxLCJudWRnZXMiOjB9LCJtaWxscmFjZTo4Ijp7InQiOjk4MCwidmlzaXRzIjoxLCJudWRnZXMiOjB9LCJtaWxscmFjZTo5Ijp7InQiOjEwODgsInZpc2l0cyI6MiwibnVkZ2VzIjowfSwibWlsbHJhY2U6MTAiOnsidCI6MTE4OCwidmlzaXRzIjoxLCJudWRnZXMiOjB9LCJtaWxscmFjZToxMiI6eyJ0IjozOTE1LCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH19LCJwbGF5RnJhbWVzIjo0OTcyMywidmlzaXRlZCI6eyJncmFuX3Jvb20iOnsiMSwwIjoxLCIwLDAiOjF9LCJncmFuX2hvdXNlIjp7IjAsMCI6MSwiMSwwIjoxLCIxLDEiOjEsIjIsMSI6MSwiMSwyIjoxfSwiaG9sbG93Ijp7IjE5LDEzIjoxLCIxOSwxNCI6MSwiMjAsMTQiOjEsIjIxLDE0IjoxLCIyMiwxNCI6MSwiMjIsMTUiOjEsIjIzLDE1IjoxLCIyMywxNiI6MSwiMjMsMTciOjEsIjIzLDE4IjoxLCIyMywxOSI6MSwiMjMsMjAiOjEsIjIzLDIxIjoxLCIyMywyMiI6MSwiMjMsMjMiOjEsIjIzLDI0IjoxLCIyNCwyNCI6MSwiMjUsMjQiOjEsIjI2LDI0IjoxLCIyNywyNCI6MSwiMjcsMjMiOjEsIjI3LDI1IjoxLCIyNiwyNSI6MSwiMjUsMjUiOjEsIjI0LDI1IjoxLCIyMywyNSI6MSwiMjIsMjUiOjEsIjIxLDI1IjoxLCIyMCwyNSI6MSwiMTksMjUiOjEsIjE4LDI1IjoxLCIxNywyNSI6MSwiMTYsMjUiOjEsIjE1LDI1IjoxLCIxNCwyNSI6MSwiMTMsMjUiOjEsIjEyLDI1IjoxLCIxMSwyNSI6MSwiMTAsMjUiOjEsIjksMjUiOjEsIjgsMjUiOjEsIjcsMjUiOjEsIjYsMjUiOjEsIjUsMjUiOjEsIjQsMjUiOjEsIjQsMjQiOjEsIjUsMjQiOjEsIjUsMjMiOjEsIjE4LDI2IjoxLCIxOSwyNiI6MSwiMjAsMjYiOjEsIjIxLDI2IjoxLCIyMiwyNiI6MSwiMjMsMjYiOjEsIjI0LDI2IjoxLCIyNSwyNiI6MSwiMjYsMjYiOjEsIjI3LDI2IjoxLCIyOCwyNiI6MSwiMjksMjYiOjEsIjI5LDI3IjoxLCIzMCwyNyI6MSwiMzAsMjYiOjEsIjMxLDI2IjoxLCIzMiwyNiI6MSwiMzMsMjYiOjEsIjM0LDI2IjoxLCIzNSwyNiI6MSwiMzYsMjYiOjEsIjM3LDI2IjoxLCIzOCwyNiI6MSwiMzksMjYiOjEsIjQwLDI2IjoxLCI0MSwyNiI6MSwiNDIsMjYiOjEsIjQzLDI2IjoxLCI0MiwyNyI6MSwiNDIsMjgiOjF9LCJ0aWR5Ijp7IjcsMTAiOjEsIjYsMTAiOjEsIjYsOSI6MSwiNSw5IjoxLCI3LDkiOjEsIjcsOCI6MSwiNyw3IjoxLCI0LDkiOjEsIjMsOSI6MSwiMiw5IjoxLCIxLDkiOjEsIjAsOSI6MSwiOCw5IjoxLCI5LDkiOjEsIjEwLDkiOjEsIjExLDkiOjEsIjEyLDkiOjEsIjEyLDEwIjoxLCIxMywxMCI6MSwiMTQsMTAiOjEsIjE0LDkiOjEsIjE0LDgiOjEsIjExLDEwIjoxLCIxMCwxMCI6MSwiNiw3IjoxLCI2LDYiOjEsIjUsNyI6MSwiNSw2IjoxLCI0LDYiOjEsIjMsNiI6MSwiMiw2IjoxLCIzLDciOjEsIjcsNiI6MSwiOCw2IjoxLCI5LDYiOjEsIjEwLDYiOjEsIjExLDYiOjEsIjEyLDYiOjEsIjEzLDYiOjEsIjEzLDciOjEsIjEyLDciOjEsIjExLDciOjEsIjEwLDciOjEsIjE0LDciOjEsIjE0LDYiOjEsIjE0LDUiOjEsIjEzLDUiOjEsIjEzLDQiOjEsIjEyLDQiOjEsIjE0LDQiOjEsIjE1LDQiOjEsIjE2LDQiOjEsIjE3LDQiOjEsIjE4LDQiOjEsIjE4LDMiOjEsIjE5LDMiOjEsIjE5LDQiOjEsIjEyLDUiOjEsIjUsNSI6MSwiNiw1IjoxLCI2LDQiOjEsIjcsNCI6MSwiOCw0IjoxLCI4LDMiOjEsIjcsMyI6MSwiOSwzIjoxLCI5LDQiOjEsIjEwLDQiOjEsIjExLDQiOjEsIjEyLDMiOjEsIjEyLDIiOjEsIjExLDIiOjEsIjEwLDIiOjEsIjEwLDEiOjEsIjksMSI6MSwiOCwxIjoxLCI3LDEiOjEsIjcsMiI6MSwiOCwyIjoxLCI5LDIiOjF9LCJraWxuIjp7IjcsMTAiOjEsIjYsMTAiOjEsIjUsMTAiOjEsIjgsMTAiOjEsIjksMTAiOjEsIjksOSI6MSwiOSw4IjoxLCI2LDkiOjEsIjcsOSI6MSwiNyw4IjoxLCI3LDciOjEsIjgsNyI6MSwiOSw3IjoxLCI2LDciOjEsIjUsNyI6MSwiNSw2IjoxLCI2LDYiOjEsIjcsNiI6MSwiOCw2IjoxLCI4LDUiOjEsIjcsNSI6MSwiNCw2IjoxLCIzLDYiOjEsIjIsNiI6MSwiMSw2IjoxLCIwLDYiOjEsIjAsNyI6MSwiMSw3IjoxLCIyLDciOjEsIjMsNyI6MSwiNCw3IjoxLCI5LDYiOjEsIjEwLDYiOjEsIjEwLDciOjEsIjEwLDUiOjEsIjExLDUiOjEsIjEyLDUiOjEsIjEzLDUiOjEsIjE0LDUiOjEsIjE0LDYiOjEsIjE0LDciOjEsIjEzLDciOjEsIjEyLDciOjEsIjExLDciOjEsIjEzLDQiOjEsIjEyLDQiOjEsIjE0LDQiOjEsIjE1LDQiOjEsIjE1LDMiOjEsIjE2LDMiOjEsIjE2LDQiOjEsIjE2LDUiOjEsIjE3LDUiOjEsIjE3LDYiOjEsIjE4LDYiOjEsIjE4LDciOjEsIjE3LDciOjEsIjE2LDciOjEsIjE1LDciOjEsIjE2LDYiOjEsIjE5LDYiOjEsIjE3LDQiOjEsIjEzLDYiOjEsIjEyLDYiOjEsIjExLDYiOjEsIjcsNCI6MSwiOCw0IjoxLCI5LDQiOjEsIjksMyI6MSwiOCwzIjoxLCI2LDQiOjEsIjUsNCI6MSwiNSwzIjoxLCI0LDQiOjEsIjQsMyI6MSwiMywzIjoxLCIzLDQiOjEsIjQsNSI6MSwiMyw1IjoxLCIyLDQiOjEsIjEsNCI6MSwiMCw0IjoxLCIwLDUiOjEsIjAsMyI6MSwiMSwzIjoxLCIxMiwyIjoxLCIxMSwyIjoxLCIxMCwyIjoxLCIxMCwxIjoxLCI5LDEiOjEsIjksMCI6MSwiOCwwIjoxLCI4LDEiOjEsIjcsMSI6MSwiNiwxIjoxLCI1LDEiOjEsIjUsMCI6MX0sIm1pbGxyYWNlIjp7IjcsMTAiOjEsIjYsMTAiOjEsIjUsMTAiOjEsIjUsOSI6MSwiNiw5IjoxLCI3LDkiOjEsIjcsOCI6MSwiNyw3IjoxLCI0LDkiOjEsIjMsOSI6MSwiMiw5IjoxLCIxLDkiOjEsIjgsOSI6MSwiOSw5IjoxLCIxMCw5IjoxLCIxMSw5IjoxLCIxMiw5IjoxLCIxMiwxMCI6MSwiMTEsMTAiOjEsIjEwLDEwIjoxLCI2LDciOjEsIjYsNiI6MSwiNyw2IjoxLCI4LDYiOjEsIjksNiI6MSwiMTAsNiI6MSwiMTEsNiI6MSwiMTIsNiI6MSwiMTIsNSI6MSwiMTIsNyI6MSwiMTEsNyI6MSwiMTAsNyI6MSwiOCw3IjoxLCI3LDUiOjEsIjcsNCI6MSwiNywzIjoxLCI4LDMiOjEsIjgsNCI6MSwiOSw0IjoxLCIxMCw0IjoxLCIxMCwzIjoxLCIxMSwzIjoxLCIxMiwzIjoxLCIxMywzIjoxLCIxMCwyIjoxLCIxMSwyIjoxLCIxMiwyIjoxLCIxMiwxIjoxLCIxMiwwIjoxLCIxMSwwIjoxLCIxMywxIjoxLCIxNCwxIjoxLCIxNSwxIjoxLCIxNiwxIjoxLCIxNywxIjoxLCIxOCwxIjoxLCIxOSwxIjoxLCIxOSwwIjoxLCIxOCwwIjoxLCIxNywwIjoxLCIxNiwwIjoxLCIxNSwwIjoxLCIxMSwxIjoxLCIxMCwxIjoxLCI5LDEiOjEsIjgsMSI6MSwiOCwwIjoxLCI5LDIiOjEsIjgsMiI6MSwiNywyIjoxLCI3LDEiOjEsIjYsMiI6MSwiNSwyIjoxLCI1LDEiOjEsIjYsMSI6MSwiNiwwIjoxfX19LCJwb3MiOnsiYXJlYSI6ImhvbGxvdyIsIngiOjI3NDMuMjAwMDAwMDAwMDA0NCwieSI6MTg1MCwiZGlyIjoyLCJtYXJrIjp7ImFyZWEiOiJob2xsb3ciLCJ0eCI6MTcwLCJ0eSI6MTE1fX0sInNlZWQiOjIwMjYxMTA5fQ==';
const END_OF_ROAD = [128 + 37, 80 + 26];

/* from T18 (the far bank, no Bedroll): onto the ferry at its east landing, paddled west into the river, down over the
   falls, east, and ashore on the beach (170,115), as the report rode it */
function ride(HW) {
    const p = HW.player(), f = HW.G.map.find('mwFerry');
    assert.ok(HW.walkTo(171, 106, 20000), 'to the ferry');
    assert.ok(until(HW, () => f.tx === 170 && f.ty === 106 && !f.mv, 1500), 'the ferry in');
    step(HW, 'left');
    HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 300 && p.tx > 168; i++) { HW.hold(['tool', 'left']); HW.step(1); } HW.release(); HW.step(4);
    for (let i = 0; i < 900 && p.ty < 115; i++) { HW.hold(['tool', 'down']); HW.step(1); } HW.release(); HW.step(60);
    for (let i = 0; i < 600 && p.tx < 169; i++) { HW.hold(['tool', 'right']); HW.step(1); } HW.release(); HW.step(4);
    step(HW, 'right'); HW.step(10);
    assert.deepEqual(at(HW), [170, 115], 'ashore below the falls');
    assert.equal(p.state, 'normal');
}
/* west off the beach into the river: under, and home (a heart less) */
function fallIn(HW) {
    const p = HW.player(), hp = HW.Inv.hp;
    HW.walkTo(170, 115, 2000);
    HW.hold('left'); until(HW, () => p.state !== 'normal', 120); HW.release();
    until(HW, () => p.state === 'normal', 600); HW.step(30);
    assert.equal(HW.Inv.hp, hp - 1, 'fallen in');
}

test('ridden over the falls and stepped ashore, a fall in takes Wren home to where she was before the ride', () => {
    const HW = load(code('T18'));
    const before = mark(HW);
    ride(HW);
    assert.deepEqual(mark(HW), before, 'the beach is not her mark');
    HW.step(400);
    assert.notEqual(HW.G.map.find('mwFerry').tx, 169, 'the ferry gone home');
    fallIn(HW);
    assert.deepEqual(at(HW), before, 'home, where she was before the ride');
    noErrors(HW);
});

test('a save made on the beach loads there with her mark from before the ride: a fall in takes her to it', () => {
    const HW = load(code('T18'));
    const before = mark(HW);
    ride(HW);
    HW.Save.write(1);
    const H2 = load(HW.Save.code(1));
    assert.deepEqual(at(H2), [170, 115], 'loaded on the beach');
    assert.deepEqual(mark(H2), before, 'her mark kept from the save');
    fallIn(H2);
    assert.deepEqual(at(H2), before, 'home, where she was before the ride');
    noErrors(H2);
});

test("a save from the beach made before (the tester's: the beach its own mark) loads with home at the end of the road by the ferry", () => {
    const HW = load(BEACH);
    assert.deepEqual(at(HW), [171, 115], 'loaded on the beach');
    assert.deepEqual(mark(HW), END_OF_ROAD, 'home is the end of the road');
    fallIn(HW);
    assert.deepEqual(at(HW), END_OF_ROAD, 'not back on the beach: at the end of the road, by the ferry');
    noErrors(HW);
});

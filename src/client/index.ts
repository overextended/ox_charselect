import { SPAWN_LOCATION } from 'config';
import { sleep } from '@overextended/ox_lib';
import 'locales';
import { cache, waitFor } from '@overextended/ox_lib/client';
import type { Character, NewCharacter } from '@overextended/ox_core';
import { netEvent } from 'utils';

let cam = 0;
let hidePlayer = false;

async function setPlayerAsHidden(bool: boolean) {
  hidePlayer = bool;

  if (hidePlayer) {
    SetPedAoBlobRendering(cache.ped, false);

    await waitFor(
      () => {
        if (!hidePlayer) return true;

        SetLocalPlayerInvisibleLocally(true);
      },
      null,
      false
    );
  }

  SetPedAoBlobRendering(cache.ped, true);
}

netEvent('ox:startCharacterSelect', async (_userId: number, characters: Character[]) => {
  setPlayerAsHidden(true);

  while (!IsScreenFadedOut()) {
    DoScreenFadeOut(0);
    await sleep(0);
  }

  SetEntityCoordsNoOffset(cache.ped, SPAWN_LOCATION[0], SPAWN_LOCATION[1], SPAWN_LOCATION[2], true, true, false);
  StartPlayerTeleport(
    cache.playerId,
    SPAWN_LOCATION[0],
    SPAWN_LOCATION[1],
    SPAWN_LOCATION[2],
    SPAWN_LOCATION[3],
    false,
    true,
    false
  );

  while (!UpdatePlayerTeleport(cache.playerId)) await sleep(0);

  const camOffset = GetOffsetFromEntityInWorldCoords(cache.ped, 0.0, 4.7, 0.2);
  cam = CreateCameraWithParams(
    'DEFAULT_SCRIPTED_CAMERA',
    camOffset[0],
    camOffset[1],
    camOffset[2],
    0.0,
    0.0,
    0.0,
    30.0,
    false,
    0
  );

  SetCamActive(cam, true);
  RenderScriptCams(true, false, 0, true, true);
  PointCamAtCoord(cam, SPAWN_LOCATION[0], SPAWN_LOCATION[1], SPAWN_LOCATION[2] + 0.1);
  DoScreenFadeIn(200);

  /**
   * Setup your menu or interface here. After selecting the character, return the charId and trigger:
   *  emitNet('ox:setActiveCharacter', charId)
   *
   * When creating a new character, the output data should match the NewCharacter type.
   *    const character: {
   *    firstName: string,
   *    lastName: string,
   *    gender: string,
   *    date: number,
   *  };
   *
   * The same event is used for creating a new character:
   *  emitNet('ox:setActiveCharacter', character);
   *
   * When deleting a character, use ox_core's callback event:
   *  const success = await triggerServerCallback<boolean>('ox:deleteCharacter', 0, charId);
   */
});

/**
 * This event is triggered from ox_core after fully loading the character.
 * Use it to smoothly end your character selection and spawn the player.
 */
netEvent('ox:setActiveCharacter', async (character: Character) => {
  if (!character.isNew) {
    DoScreenFadeOut(300);

    while (!IsScreenFadedOut()) await sleep(0);
  }

  RenderScriptCams(false, false, 0, true, true);
  DestroyCam(cam, false);
  setPlayerAsHidden(false);

  cam = 0;

  // Keep player in the same location if they don't have a saved position.
  if (!character.x) {
    return DoScreenFadeIn(200);
  }

  // Switch out and transition to the player's saved position.
  const [x, y, z, heading] = [character.x || 0, character.y || 0, character.z || 0, character.heading || 0];

  SwitchOutPlayer(cache.ped, 0, 1);

  while (GetPlayerSwitchState() !== 5) await sleep(0);

  SetEntityCoordsNoOffset(cache.ped, x, y, z, false, false, false);
  SetEntityHeading(cache.ped, heading);
  RequestCollisionAtCoord(x, y, z);
  DoScreenFadeIn(200);
  SwitchInPlayer(cache.ped);
  SetGameplayCamRelativeHeading(0);

  while (GetPlayerSwitchState() !== 12) await sleep(0);

  while (!HasCollisionLoadedAroundEntity(cache.ped)) await sleep(0);
});

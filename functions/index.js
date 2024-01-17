$(document).ready(function () {
    const input = $('#textbox');
    const button = $('#submit');
    const output = $('#output');
    let loadingpercent;

    window.onload = function() {
        setTimeout(function() {
            $('#wait').hide();
            $('#submit').show();
        }, 1000);
    }


    function toggleSubmitButton() {
        const playerId = input.val();
    }

    function highlightInputBox() {
        const originalColor = input.css('background-color');
        input.css('background-color', 'white');
        input.animate({ 'background-color': originalColor }, 2000);
    }

    function displayErrorMessage(message) {
        output.empty();
        const errorMessage = $(`<p class="error-message" style="color: red;">${message}</p>`);
        output.append(errorMessage);
        const originalColor = input.css('background-color');
        input.css('background-color', 'red');
        input.animate({ 'background-color': originalColor }, 2000);
        setTimeout(() => {
            errorMessage.fadeOut(2000, function () {
                errorMessage.remove();
                input.css('background-color', originalColor);
            });
        }, 4000);
    }

    input.on('input', function () {
        toggleSubmitButton();
        input.css('background-color', 'white');
    });

    function unixTimestampToDate(timestamp) {
        var date = new Date(timestamp * 1000);
        return date.toLocaleDateString("en-US") + ' ' + date.toLocaleTimeString("en-US");
    }

    $('#submit').click(async function () {
      $('#loading').show();

      try {
          const playerid = input.val();
          if (!playerid.trim()) {
              displayErrorMessage("Please input your Gods Unchained Player ID");
              highlightInputBox();
              $('#loading').hide();
              return;
          }
          const invalidInput = /\D/.test(playerid);
          if (invalidInput) {
              displayErrorMessage("Your Player ID must only contain numbers");
              highlightInputBox();
              $('#loading').hide();
              return;
          }

          const currentTimestamp = Math.floor(Date.now() / 1000);
          const matches = [];
          let page, page2;
          let wonRecords = [];
          let lostRecords = [];
          let username;

          async function makeApiRequest(url, retryCount = 3) {
              try {
                  const response = await $.get(url);
                  return JSON.parse(response);
              } catch (error) {
                  if (retryCount > 0) {
                      console.log(`Retrying API request: ${url}`);
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      return makeApiRequest(url, retryCount - 1);
                  } else {
                      console.error(`Failed to fetch data from API: ${url}`);
                      throw error;
                  }
              }
          }

          await new Promise(async (resolve, reject) => {
              $.get(`https://api.godsunchained.com/v0/properties?user_id=${playerid}`, async (d) => {
                  try {
                      const dat = JSON.parse(d);
                      const recs = dat.records;
                      const user = recs[0];
                      username = user.username;
                      console.log("API call 1 complete");

                      loadingpercent = 1;
                      $("#loadingPercentText").text(`${loadingpercent}`);

                      await new Promise(resolve => setTimeout(resolve, 1000));

                      $.get(`https://api.godsunchained.com/v0/match?game_mode=6&end=${currentTimestamp}-&player_won=${playerid}`, async (data) => {
                          try {
                              const obj = JSON.parse(data);
                              page = Math.ceil(obj.total / 20);
                              console.log("API call 2 complete");

                              loadingpercent = 2;
                              $("#loadingPercentText").text(`${loadingpercent}`);

                              await new Promise(resolve => setTimeout(resolve, 1000));

                              $.get(`https://api.godsunchained.com/v0/match?game_mode=6&end=${currentTimestamp}-&player_won=${playerid}&page=${page}`, async (data) => {
                                  try {
                                      const obj = JSON.parse(data);
                                      wonRecords.push(...obj.records.filter(x => x.game_mode === 6));
                                      console.log("API call 3 complete");

                                      loadingpercent = 3;
                                      $("#loadingPercentText").text(`${loadingpercent}`);

                                      await new Promise(resolve => setTimeout(resolve, 1000));

                                      if (page > 1) {
                                          $.get(`https://api.godsunchained.com/v0/match?game_mode=6&end=${currentTimestamp}-&player_won=${playerid}&page=${page - 1}`, async (data) => {
                                              try {
                                                  const obj = JSON.parse(data);
                                                  wonRecords.push(...obj.records.filter(x => x.game_mode === 6));
                                                  console.log("API call 4 complete");

                                                  loadingpercent = 4;
                                                   $("#loadingPercentText").text(`${loadingpercent}`);

                                                  await new Promise(resolve => setTimeout(resolve, 1000));
                                                  resolve();
                                              } catch (error) {
                                                  console.error("Error retrieving won matches from second last page:", error);
                                                  reject("Error retrieving won matches from second last page");
                                              }
                                          }).fail(function() {
                                              displayErrorMessage("Error retrieving won matches from second last page. Please try again.");
                                              $('#loading').hide();
                                              reject("Error retrieving won matches from second last page");
                                          });
                                      } else {
                                          resolve();
                                      }
                                  } catch (error) {
                                      console.error("Error 2:", error);
                                      reject("Error 2");
                                  }
                              }).fail(function() {
                                  displayErrorMessage("Error 2. Please try again.");
                                  $('#loading').hide();
                                  reject("Error 2");
                              });
                          } catch (error) {
                              console.error("Error 1:", error);
                              reject("Error 1");
                          }
                      }).fail(function(jqXHR, textStatus) {
                          if (jqXHR.status === 429) {
                              displayErrorMessage("Rate limit exceeded. Please try again later.");
                          } else {
                              displayErrorMessage("Error 1. Please try again.");
                          }
                          $('#loading').hide();
                          reject("Error 1");
                      });
                  } catch (error) {
                      console.error("Error:", error);
                      $('#loading').hide();
                      reject("Error");
                  }
              });
          });

          await new Promise(async (resolve, reject) => {
          $.get(`https://api.godsunchained.com/v0/match?game_mode=6&end=${currentTimestamp}-&player_lost=${playerid}`, async (data) => {
                          try {
                              const obj = JSON.parse(data);
                              page2 = Math.ceil(obj.total / 20);
                              console.log("API call 5 complete");

                              loadingpercent = 5;
                              $("#loadingPercentText").text(`${loadingpercent}`);

                              await new Promise(resolve => setTimeout(resolve, 1000));

                  $.get(`https://api.godsunchained.com/v0/match?game_mode=6&end=${currentTimestamp}-&player_lost=${playerid}&page=${page2}`, async (data) => {

                      try {
                          const obj = JSON.parse(data);
                          lostRecords.push(...obj.records.filter(x => x.game_mode === 6));
                          console.log("API call 6 complete");

                          loadingpercent = 6;
                          $("#loadingPercentText").text(`${loadingpercent}`);

                          await new Promise(resolve => setTimeout(resolve, 1000));

                          if (page > 1) {
                          $.get(`https://api.godsunchained.com/v0/match?game_mode=6&end=${currentTimestamp}-&player_lost=${playerid}&page=${page2 - 1}`, async (data) => {
                              try {
                                  const obj = JSON.parse(data);
                                  lostRecords.push(...obj.records.filter(x => x.game_mode === 6));
                                  console.log("API call 7 complete");

                                  loadingpercent = 7;
                                  $("#loadingPercentText").text(`${loadingpercent}`);

                                  await new Promise(resolve => setTimeout(resolve, 1000));

                                  loadingpercent = 8;
                                  $("#loadingPercentText").text(`${loadingpercent}`);
                                  await new Promise(resolve => setTimeout(resolve, 1000));


                                  resolve();
                                              } catch (error) {
                                                  console.error("Error retrieving won matches from second last page:", error);
                                                  reject("Error retrieving won matches from second last page");
                                              }
                                          }).fail(function() {
                                              displayErrorMessage("Error retrieving won matches from second last page. Please try again.");
                                              $('#loading').hide();
                                              reject("Error retrieving won matches from second last page");
                                          });
                              } else {
                                  resolve();
                              }
                              } catch (error) {
                                  console.error("Error 2:", error);
                                  reject("Error 2");
                              }
                              }).fail(function() {
                                  displayErrorMessage("Error 2. Please try again.");
                                  $('#loading').hide();
                                  reject("Error 2");
                              });
                          } catch (error) {
                              console.error("Error 1:", error);
                              reject("Error 1");
                          }
                      }).fail(function(jqXHR, textStatus) {
                          if (jqXHR.status === 429) {
                              displayErrorMessage("Rate limit exceeded. Please try again later.");
                          } else {
                              displayErrorMessage("Error 1. Please try again.");
                          }
                          $('#loading').hide();
                          reject("Error 1");
                      });
          });
                              console.log(wonRecords);
                              console.log(lostRecords);
                              matches.push(wonRecords);
                              matches.push(lostRecords);

                              const flattened = matches.flat().filter(x => x !== null);
                              const filtered = flattened.sort((a, b) => b.end_time - a.end_time);

                              if (output.children().length === 0) {
                                  $('#loading').hide();
                                  const resultDiv = $('<div class="playercard">');
                                  resultDiv.append(`<h2>${username}</h2>`);
                                  resultDiv.append(`<p>${wonRecords && wonRecords.length || 0} W&nbsp;&nbsp;-&nbsp;&nbsp;${lostRecords && lostRecords.length || 0} L</p>`);
                                  output.append(resultDiv);

                                  $('.topbar').hide();
                                  $('.topbar2').hide();
                                  $('#submit').hide();
                                  $('.input-fields').hide();
                                  $('.topbar2').css('margin-top','0px');
                                  $('#reset').css('margin','10px 0 0px 0');

                                  filtered.map((x) => {
                                      const { player_won, player_lost, end_time } = x;
                                      const dateStr = unixTimestampToDate(end_time);
                                      const participants = [player_won, player_lost];
                                      const opponentid = participants.find((x) => x !== parseInt(playerid));
                                      const matchId = x.game_id;
                                      const containerId = `${matchId}-container`;
                                      const outcome = parseInt(player_won) === parseInt(playerid) ? 'WON' : 'LOST';
                                      const opponentOutcome = parseInt(player_won) !== parseInt(playerid) ? 'WON' : 'LOST';
                                      const buttonClass = outcome === 'WON' ? 'won' : 'lost';
                                      
                                      



                                      output.append(`
                                          <div class="matches-container" id='${containerId}'>
                                              <button style="display: flex; flex-direction: column; align-items: center;" 
                                                      class='action-button ${buttonClass}' data-match-id="${matchId}">
                                                  ${username} vs. ${opponentid}
                                                  <div class="match-date">${dateStr}</div>
                                              </button>
                                          </div>
                                      `);
                                      $(`#${containerId}`).on('click', '.action-button', async (e) => {

                                          const id = $(e.target).data('match-id');
                                          const targetMatchArr = filtered.filter(x => x.game_id === id);
                                          const targetMatch = targetMatchArr[0];
                                          const { player_won, player_info } = targetMatch;
                                          await new Promise(resolve => setTimeout(resolve, 500));
                                          const outcome = parseInt(player_won) === parseInt(playerid) ? '<p1>WON</p1>' : '<p3>LOST</p3>';
                                          const opponentOutcome = parseInt(player_won) !== parseInt(playerid) ? '<p1>WON</p1>' : '<p3>LOST</p3>';
                                          const userInfo = player_info.find((x) => x.user_id === parseInt(playerid));
                                          const opponentInfo = player_info.find((x) => x.user_id !== parseInt(playerid));
                                          const userGod = userInfo.god;
                                          const opponentGod = opponentInfo.god;
                                          const { cards: userCards } = userInfo;
                                          const { cards: opponentCards, user_id: opponentPlayerid } = opponentInfo;

                                          const container = `
                                              <div id="${id}" class="versus-container">
                                                  <div class="versus-buttons">
                                                      <button class="close-button" id="${id}-${playerid}-close">Close</button>
                                                  </div>
                                                  <div class="player-container">
                                                      <div class="user-container">
                                                          <div><h2><a style="text-decoration: underline;" target=_blank href=https://gudecks.com/meta/player-stats?userId=${playerid}>${username}</a></h2></div>
                                                          <div class="god-result" style="text-transform: uppercase;">
                                                              <div class="god">${userGod}</div> 
                                                              <div class="result">${outcome}</div>
                                                          </div>
                                                          <div class="container"></div>
                                                          <div class="loading-user-cards" id="loading-user-cards-${id}">
                                                              Downloading cards...
                                                          </div>
                                                          <div class="image-container"></div>
                                                      </div>
                                                      <div class="horizontal-line"></div>
                                                      <button class="close-button" id="${id}-${playerid}-close">Close</button>
                                                      <div class="opponent-container">
                                                          <div class="container">
                                                              <div><h2><a style="text-decoration: underline;" target=_blank href=https://gudecks.com/meta/player-stats?userId=${opponentPlayerid}>${opponentPlayerid}</a></h2></div>
                                                              <div class="god-result" style="text-transform: uppercase;">
                                                                  <div class="god">${opponentGod}</div> 
                                                                  <div class="result">${opponentOutcome}</div>
                                                              </div>
                                                              <div class="loading-opponent-cards" id="loading-opponent-cards-${id}">
                                                                Downloading cards...
                                                              </div>
                                                              <div class="image-container"></div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          `;

                                          if ($(`#${id}-container`).children().length === 1) {
                                              $(`#${id}-container`).append(container);
                                              $(`#${id}-${playerid}-close`).show();

                                              function checkImagesLoaded(containerId) {
                                                  return new Promise((resolve, reject) => {
                                                      const allImages = $(`#loading-user-cards-${containerId}, #loading-opponent-cards-${containerId}`).siblings(".image-container").find("img");
                                                      let allImagesLoaded = 0;

                                                      allImages.on('load', function () {
                                                          allImagesLoaded++;
                                                          if (allImagesLoaded === allImages.length) {
                                                              console.log("All images have loaded for container:", containerId);
                                                              $(`#loading-user-cards-${containerId}, #loading-opponent-cards-${containerId}`).hide();
                                                              resolve();
                                                          }
                                                      });

                                                      setTimeout(resolve, 3000);
                                                  });
                                              }
                                              checkImagesLoaded(id).then(() => {
                                                  console.log("All images have loaded for container:", id);
                                                  $(`#loading-user-cards-${id}, #loading-opponent-cards-${id}`).hide();
                                              });
                                          }

                                          console.log($(`#${id}-container`).children());
                                          const showCards = (cards, target) => {
                                              const myCards = [];
                                              $.get("https://api.godsunchained.com/v0/proto?perPage=3000", function (data) {
                                                  const cardData = JSON.parse(data);
                                                  const allCards = cardData.records;
                                                  cards.map((x) => {
                                                      const card = allCards.filter((y) => y.id === parseInt(x));
                                                      const targetcard = card[0];
                                                      const cardId = targetcard.id;
                                                      const result = {
                                                          ...targetcard,
                                                          image: `https://card.godsunchained.com/?id=${cardId}&q=4`
                                                      };
                                                      myCards.push(result);
                                                  });
                                                  const sorted = myCards.sort((a, b) => {
                                                      return a.mana - b.mana;
                                                  });
                                                  console.log(sorted);
                                                  sorted.map((x) => {
                                                      if ($(`#${id}-container`).find(target).find(".image-container").children().length <= sorted.length - 1) {
                                                          $(`#${id}-container`).find(target).find(".image-container").append(`<img class="card-image" src=${x.image}/>`);
                                                      }
                                                  });
                                              });
                                          };
                                          showCards(userCards, '.user-container');
                                          showCards(opponentCards, '.opponent-container');
                                          const godElement = $(`#${id}-container`).find('.god');
                                          const opponentGodElement = $(`#${id}-container`).find('.opponent-container .god');
                                          console.log(godElement);
                                          godElement.addClass(userGod.toLowerCase());
                                          opponentGodElement.addClass(opponentGod.toLowerCase());

                                          $(`#${containerId}`).on('click', '.close-button', function (event) {
                                              console.log("Close button clicked!");
                                              const closeBtnId = event.currentTarget.id;
                                              const id = closeBtnId.split("-");
                                              id.pop();
                                              id.pop();
                                              const matchId = id.join("-");
                                              console.log("Closing match details for matchId:", matchId);
                                              $(`#${matchId}`).remove();
                                          });
                                      });
                                  });
                              }

      } catch (error) {
          console.error("Submit Error:", error);
          $('#loading').hide();
      }
  });


$('#reset').click(function () {
      location.reload();
});
});
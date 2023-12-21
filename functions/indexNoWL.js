$(document).ready(function () {
  const container = $('#container');
  const input = $('#textbox');
  const button = $('#submit');
  const output = $('#output');
  const timeStamp = $('#timestamp');

  button.click(function myFunc() {
    const myCards = [];
    const playerid = input.val();
    const time = timeStamp.val();
    const matches = [];
    let wonRecords;
    let lostRecords;
    let username;

    $.get(`https://api.godsunchained.com/v0/properties?user_id=${playerid}`, (d) => {
      const dat = JSON.parse(d);

      const recs = dat.records;
      const user = recs[0];

      username = user.username;

      $.get(`https://api.godsunchained.com/v0/match?start_time=${time}-&player_won=${playerid}`, (data) => {
        const obj = JSON.parse(data);
        wonRecords = obj.records && obj.records.filter((x) => x.game_mode === 6) || null;
        matches.push(wonRecords);
        $.get(`https://api.godsunchained.com/v0/match?start_time=${time}-&player_lost=${playerid}`, (data) => {
          const obj = JSON.parse(data);
          lostRecords = obj.records && obj.records.filter((x) => x.game_mode === 6) || null;
          matches.push(lostRecords);

          const flattened = matches.flat()
          const filtered = flattened.filter((x) => x !== null);

          if (output.children().length === 0) { 
            output.append(`<p>${username}</p><br>`)
            output.append(`<p>Total Matches: </p>`)
            output.append(`<p>Won Matches: </p>`);
            output.append(`<p>Lost Matches: </p><br>`);  
            filtered.map((x) => {
              const { 
                player_won,
                player_lost
              } = x;
              const participants = [player_won, player_lost];
              console.log(participants)
              const opponentid = participants.find((x) => x !== parseInt(playerid));
              output.append(`
                <div id='${x.game_id}-container'>
                  <button class='action-button' id=${x.game_id}>See Match Details of match against ${opponentid}</button>
                </div>
              `)
            });
          }
          $('.action-button').click(async (e) => {

            const id = e.target.id;
            const targetMatchArr = filtered.filter(x => x.game_id === id);
            const targetMatch = targetMatchArr[0];
            const { player_won, player_info } = targetMatch;
            const outcome = parseInt(player_won) === parseInt(playerid) ? 'Won' : 'Lost';
            const opponentOutcome = parseInt(player_won) !== parseInt(playerid) ? 'Won' : 'Lost';

            const userInfo = player_info.find((x) => x.user_id === parseInt(playerid));
            const opponentInfo = player_info.find((x) => x.user_id !== parseInt(playerid));

            const { cards: userCards, god: userGod,  } = userInfo;
            const { cards: opponentCards, user_id: opponentPlayerid, god: opponentGod } = opponentInfo;

            const container = `
              <div class="versus-container">
                <div class="user-container">
                  <div><br>${username}</div>
                  <div class="container">
                    <span>
                    
                    </span>
                    <span>
                      God used: ${userGod}
                    </span>
                    <button id="${id}-${playerid}-deck">v   See Deck   v</button>
                  </div>
                  <div class="image-container">
                  </div>
                </div>
                <div class="opponent-container">
                  <div class="container">
                    <span>
                    ${opponentPlayerid}<br/>
                    </span>
                    <a target=_blank href=https://gudecks.com/meta/player-stats?userId=${opponentPlayerid}>
                    Opponent GUDecks Link
                    </a>
                    <span>
                    
                    </span>
                    <span>
                      God used: ${opponentGod}
                    </span>
                    <button id="${id}-opponent-deck">v   See Deck   v</button>
                  </div>
                  <div class="image-container">
                  </div>
                </div>  
              </div>
            `;

            console.log($(`#${id}-container`).children())

            if ($(`#${id}-container`).children().length === 1) { 
              $(`#${id}-container`).append(container);
            }
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
                  }
                  myCards.push(result);
                });
                const sorted = myCards.sort((a, b) => {
                  return a.mana - b.mana;
                });

                console.log(sorted);
                sorted.map((x) => {
                  if ($(`#${id}-container`).find(target).find(".image-container").children().length <= sorted.length - 1) { 
                    $(`#${id}-container`).find(target).find(".image-container").append(`<img class="card-image" src=${x.image}/>`)
                  }
                });
              });
            }

            $(`#${id}-${playerid}-deck`).click(() => {
              showCards(userCards, '.user-container'),
              showCards(opponentCards, '.opponent-container');
            });

          });

        });
      });
    })








  });
});
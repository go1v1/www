import View from 'go1v1-lib/view'
import Store from 'go1v1-lib/store'

export default class Duels extends View {
  constructor(selector, summonerName) {
    super(selector)

    this.summonerName = summonerName
    this.$selected = null

    Store.duels(summonerName).then((duels) => {
      this.duels = duels
      this.show()

      this.$el.on('click', '.duel', ::this.clicked)
      $(document).on('keyup', ::this.key)
    })
  }

  render() {
    return this.duels
    .reduce((markup, duel) =>
      markup + this.renderDuel(duel)
    , '')
  }

  renderDuel(duel) {
    return `
      <li class="duel">
        ${this.renderCup(duel)}
        <figure class="summoner creator">
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
          <figcaption>ngryman</figcaption>
        </figure>
        <span class="vs">vs</span>
        <figure class="summoner target">
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
          <figcaption>Vocyfera2</figcaption>
        </figure>
      </li>
    `
  }

  renderCup(duel) {
    return this.summonerName === duel[duel.winner] ? `
      <div class="cup">
        <svg>
          <use xlink:href="#svg-cup">
        </svg>
      </div>
    ` : ''
  }

  clicked(e) {
    this.selectElement($(e.currentTarget))
  }

  key(e) {
    if (40 === e.which) {
      this.selectElement(this.$selected.next())
    }
    else if (38 === e.which) {
      this.selectElement(this.$selected.prev())
    }
  }

  selectElement($duel) {
    if (this.$selected) {
      this.$selected.removeClass('selected')
    }
    $duel.addClass('selected')
    this.$selected = $duel
    this.emit('selected', this.duels[$duel.index()].id)
  }
}

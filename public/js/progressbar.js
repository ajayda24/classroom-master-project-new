;(function (a) {
  a.fn.progressbarManager = function (h) {
    if (!a.fn.progressbarManager.GUID) {
      a.fn.progressbarManager.GUID = 1
    }
    var e = a.extend(
      {
        debug: false,
        initValue: 0,
        totalValue: 100,
        style: 'primary',
        animate: false,
        stripe: false,
        id: 'pbm-bootsrap-progress-' + a.fn.progressbarManager.GUID,
        barIdPrefix: 'pbm-progress-bar-',
        total: h.totalValue,
        addDefaultBar: true,
        data: {},
        showValueHandler: function (j) {
          var k = j.elem.attr('aria-valuenow') + '%'
          j.elem.text(k)
        },
        hideValueHandler: function (j) {
          j.elem.text('')
        },
        onComplete: function () {},
        onBarComplete: function () {},
      },
      h
    )
    e.total = parseInt(e.total)
    var i = a(this)
    function f(k) {
      var l = this
      var o = 1
      var r = {}
      var n
      var p = 0
      var q = false
      var m = c(k)
      i.append(m)
      var n = ''
      var j = function () {
        p = 0
        for (var s in r) {
          p += r[s].totalValuePercent
        }
      }
      this.setValue = function (w, u) {
        var t = this.getBar(u)
        w = parseInt(w)
        if (t) {
          if (w > t.totalValue) {
            b(
              'New Bar value is greater that the totalValue. Setting the bar percentage to full'
            )
            w = t.totalValue
          }
          var v = g(w, e.total)
          var s = Math.round(v * 10) / 10
          t.elem.attr('aria-valuenow', s)
          t.currentPercent = v
          t.currentPercentRounded = s
          t.currentValue = w
          t.elem.css('width', Math.round(v) + '%')
          if (t.showText) {
            this.showValue(u)
          }
          if (this.isComplete(u)) {
            e.onBarComplete.call(t)
          }
          j()
          if (this.isComplete()) {
            e.onComplete()
          }
        }
        return this
      }
      this.animate = function (t) {
        var s = this.getBar(t)
        if (s) {
          s.elem.addClass('active')
        }
        return this
      }
      this.animateRemove = function (t) {
        var s = this.getBar(t)
        if (s) {
          s.elem.removeClass('active')
        }
        return this
      }
      this.stripe = function (t) {
        var s = this.getBar(t)
        if (s) {
          s.elem.addClass('progress-bar-striped')
        }
        return this
      }
      this.removeStripe = function (t) {
        var s = this.getBar(t)
        if (s) {
          s.elem.removeClass('progress-bar-striped')
        }
        return this
      }
      this.style = function (s, u) {
        var t = this.getBar(u)
        if (t) {
          t.elem.removeClass('progress-bar-' + t.style)
          t.style = s
          t.elem.addClass('progress-bar-' + s)
        }
        return this
      }
      this.showValue = function (u) {
        var t = this.getBar(u)
        if (u === true) {
          for (var s in r) {
            s.showText = true
            s.showValueHandler(t)
          }
        }
        if (t) {
          t.showText = true
          t.showValueHandler(t)
        }
        return this
      }
      this.hideValue = function (u) {
        var t = this.getBar(u)
        if (u === true) {
          for (var s in r) {
            s.showText = false
            s.hideValueHandler(t)
          }
        }
        if (t) {
          t.showText = false
          t.hideValueHandler(t)
        }
        return this
      }
      this.isComplete = function (t) {
        var s = this.getBar(t)
        return s && s.currentValue >= s.totalValue
      }
      this.complete = function (t) {
        var s = this.getBar(t)
        if (s) {
          this.setValue(s.totalValue, t)
        }
        return this
      }
      this.completeAll = function () {
        var s
        for (s in r) {
          l.complete(s)
        }
      }
      this.addBar = function (B) {
        var w = a.extend(
          {
            initValue: 0,
            totalValue: 100,
            style: 'primary',
            animate: false,
            stripe: false,
            data: {},
            showValueHandler: e.showValueHandler,
            hideValueHandler: e.hideValueHandler,
          },
          B
        )
        var s = e.barIdPrefix + o
        var x = parseInt(w.initValue) || 0
        var y = parseInt(w.totalValue) || 100 - p
        var v = g(x, e.total)
        var t = Math.round(v * 10) / 10
        var A = g(y, e.total)
        var z = Math.round(A * 10) / 10
        if (z + p > 100) {
          b(
            'container can not contain the new bar element based on the percentage of its total: ' +
              z
          )
          b('Available space in percent is :' + (100 - p))
          return true
        }
        if (x > y) {
          t = z
        }
        var u = d(s, Math.round(v), w.style, x, y, w.animate, w.stripe)
        m.append(u)
        r[s] = {
          totalValue: y,
          currentValue: x,
          init: x,
          initPercent: v,
          totalValuePercent: A,
          totalValuePercentRounded: z,
          currentPercent: v,
          currentPercentRounded: t,
          style: w.style,
          elem: u,
          showText: true,
          id: s,
          data: w.data,
          showValueHandler: w.showValueHandler,
          hideValueHandler: w.hideValueHandler,
        }
        w.showValueHandler(r[s])
        o++
        j()
        return s
      }
      this.removeBar = function (t) {
        var s = this.getBar(t)
        if (s) {
          s.elem.remove()
        }
      }
      this.destroy = function () {
        m.remove()
      }
      this.getBar = function (s) {
        var t = s || n
        if (r[t]) {
          return r[t]
        }
        b('No progress bar element with id: ' + t)
        return null
      }
      if (e.addDefaultBar) {
        n = this.addBar(e)
      }
    }
    var c = function (j) {
      return a('<div></div>', { id: j, class: 'progress' })
    }
    var d = function (l, p, k, o, q, m, r) {
      var n = a('<div></div>')
      var j = 'progress-bar progress-bar-' + k
      if (m) {
        j += ' active '
      }
      if (r) {
        j += ' progress-bar-striped'
      }
      n.attr('id', l).attr('role', 'progress-bar')
      n.attr('aria-valuenow', p).attr('aria-valuemin', o)
      n.attr('aria-valuemax', q).css({ width: p + '%', 'min-width': '2em' })
      n.addClass(j)
      n.append(
        '<span class="sr-only sr-indicator">' + p + '% Complete</span></div>'
      )
      return n
    }
    var g = function (k, j) {
      return 100 - ((j - k) / j) * 100
    }
    var b = function (j) {
      if (e.debug) {
        console.log('Progress Bar Manager Debug => ' + j)
      }
    }
    a.fn.progressbarManager.GUID++
    return new f(e.id)
  }
})(jQuery)

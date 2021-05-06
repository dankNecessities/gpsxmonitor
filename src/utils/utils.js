/**
 * Reusable utility functional objects
 */

const Utils = {
  /**
   * Return modified array with objects sorted into categories, which are
   * mapped with identifier colors
   */
  getIDList: (list) => {
    let ids = {};
    list.map((_, i) => {
      ids[_.id] = Number(_.id);
    });
    return Object.values(ids);
  },
  createCategories: (groups, trackers) => {
    let categories = [];
    let modified_groups = [
      ...groups,
      {color: '1e96dc', id: 0, title: 'No Group'},
    ];
    modified_groups.map((group, i) => {
      let tracker_list = [];
      trackers.map((tracker, index) => {
        if (group.id === Number(tracker.group_id)) {
          tracker_list.push(tracker);
        }
      });
      if (tracker_list.length > 0) {
        categories.push({...group, trackers: tracker_list});
      }
    });
    return categories;
  },
  getTimeDifference: (dateString) => {
    if (dateString) {
      let destructuredTime = '';
      let diff = new Date(
        Date.now() - Date.parse(dateString.replace(/-+/g, '/')),
      );
      let millis = diff.getTime();
      let ranges = [
        {name: 'day', length: 86400000},
        {name: 'hour', length: 3600000},
        {name: 'min', length: 60000},
        {name: 'second', length: 1000},
      ];
      ranges.map((_, i) => {
        let total = Math.floor(millis / _.length);
        if (total > 0 && total == 1) {
          destructuredTime += `${total} ${_.name} `;
        } else if (total > 1) {
          destructuredTime += `${total} ${_.name}s `;
        }
        millis = millis % _.length;
      });
      return destructuredTime;
    } else {
      return '';
    }
  },
  getSignalIcon: (signal_level) => {
    if (signal_level > 75) {
      return require('../assets/signal/strong.png');
    } else if (signal_level <= 75 && signal_level > 50) {
      return require('../assets/signal/good.png');
    } else if (signal_level <= 50 && signal_level > 25) {
      return require('../assets/signal/low.png');
    } else if (signal_level <= 25) {
      return require('../assets/signal/poor.png');
    }
  },
  getDirection: (degrees) => {
    /**
     * Azimuthal direction using quadrants
     * Approximations for compass rose (leading letters determine direction e.g NNE)
     * Allowance is 22.5 degrees
     */
    if ((degrees <= 22.5 && degrees > 337.5) || degrees === 0) {
      return 'N';
    } else if (degrees <= 67.5 && degrees > 22.5) {
      return 'NE';
    } else if (degrees <= 112.5 && degrees > 67.5) {
      return 'E';
    } else if (degrees <= 157.5 && degrees > 112.5) {
      return 'SE';
    } else if (degrees <= 202.5 && degrees > 157.5) {
      return 'S';
    } else if (degrees <= 247.5 && degrees > 202.5) {
      return 'SW';
    } else if (degrees <= 292.5 && degrees > 247.5) {
      return 'W';
    } else if (degrees <= 337.5 && degrees > 292.5) {
      return 'NW';
    }
  },
};

export default Utils;

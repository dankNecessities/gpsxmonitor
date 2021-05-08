import React, {useEffect, useState} from 'react';
import {StatusBar, ToastAndroid} from 'react-native';
import styled from 'styled-components';
import DrawerLoader from '../components/loaders/drawerLoader';
import DetailItem from '../components/items/detailItem';
import Storage from '../storage/storage';
import API from '../api/api';
import Utils from '../utils/utils';
import lists from '../components/lists/lists';

// TODO Pass the location as a state prop, or as an event emitter
export default function DetailsScreen({route, navigation}) {
  const [loading, setLoading] = useState(true);
  const [itemList, setItemList] = useState([]);

  const constructModelObject = (tracker, model, state) => {
    return constructObject(tracker.label, null, [
      {
        type: 'image',
        image: require('../assets/chip.png'),
        text: `Model: ${model.name}`,
      },
      {
        type: 'image',
        image: require('../assets/hash.png'),
        text: `ID: ${tracker.source.device_id.replace(/\d{4}(?=.)/g, '$& ')}`,
      },
      {
        type: 'component',
        status: lists.statusColors[state.connection_status],
      },
    ]);
  };

  const constructLocationObject = (state, gpsPoint) => {
    return constructObject('Location', state.gps.updated, [
      {
        type: 'image',
        image: Utils.getSignalIcon(state.gps.signal_level),
        text: `Signal: ${state.gps.signal_level} %`,
      },
      {
        type: 'image',
        image: require('../assets/location.png'),
        text: `Latitude: ${gpsPoint.lat.toFixed(
          5,
        )} Longitude: ${gpsPoint.lng.toFixed(5)}`,
      },
      gpsPoint.speed > 0
        ? {
            type: 'image',
            image: require('../assets/speed.png'),
            text: `Speed: ${gpsPoint.speed} km/h`,
          }
        : {
            type: 'image',
            image: Utils.getMovementIcon(state.movement_status),
            text: `Parked for ${Utils.getTimeDifference(
              state.actual_track_update,
              false,
            )}`,
          },
      {
        type: 'image',
        image: require('../assets/compass.png'),
        text: `Direction: ${Utils.getDirection(gpsPoint.heading)}`,
      },
      {
        type: 'image',
        image: require('../assets/address.png'),
        text: `${gpsPoint.address}`,
      },
    ]);
  };

  const constructGSMObject = (state) => {
    return constructObject('GSM', state.gsm.updated, [
      {
        type: 'image',
        image: Utils.getSignalIcon(state.gsm.signal_level),
        text: `Signal: ${state.gsm.signal_level} %`,
      },
      {
        type: 'image',
        image: require('../assets/antenna.png'),
        text: `Operator: ${state.gsm.network_name}`,
      },
    ]);
  };

  const constructPowerObject = (state, readings) => {
    return constructObject('Power Supply', readings.update_time, [
      {
        type: 'image',
        image: Utils.getBatteryIcon(state.battery_level),
        text: `Battery level: ${state.battery_level} %`,
      },
      {
        type: 'image',
        image: require('../assets/car_battery.png'),
        text: `Board voltage: ${readings.inputs[0].value} V`,
      },
    ]);
  };

  const constructInputsObject = (inputs) => {
    let serializedInputs = [];
    let matchedInputs = [];
    inputs.inputs.map((_, i) => {
      for (var j = 0; j < inputs.states.length; j++) {
        if (inputs.states[j].input_number === i + 1) {
          matchedInputs[i] = {
            type: 'image',
            image:
              lists.inputTypes[inputs.states[j].type][inputs.states[j].status],
            text: `${inputs.states[j].name}: ${
              inputs.states[j].status ? 'active' : 'inactive'
            }`,
          };
          break;
        } else {
          matchedInputs[i] = null;
        }
      }
    });
    matchedInputs.map((_, i) => {
      console.log(i);
      if (_ !== null) {
        serializedInputs.push(_);
      } else {
        serializedInputs.push({
          type: 'component',
          status: {
            color: inputs.inputs[i] ? '#66c011' : '#626160',
            size: 18,
            text: `Input #${i + 1}: ${
              inputs.inputs[i] ? 'active' : 'inactive'
            }`,
            number: i + 1,
          },
        });
      }
    });
    return constructObject('Inputs', inputs.update_time, serializedInputs);
  };

  // TODO Account
  const constructTasksObject = (state, tasks) => {
    let numberOfTasks = 0;
    let taskDuration = 0;
    let taskDelay = 0;
    let assignedTasks = 0;
    let doneTasks = 0;
    let failedTasks = 0;
    let delayedTasks = 0;
    tasks.map((_, i) => {
      if (_.status !== 'unassigned') {
        numberOfTasks += 1;
      }
      if (_.status === 'assigned') {
        assignedTasks += 1;
        let diff = new Date(
          Date.parse(_.to.replace(/-+/g, '/')) -
            Date.parse(_.from.replace(/-+/g, '/')),
        );
        taskDuration += diff.getTime();
      } else if (_.status === 'done') {
        doneTasks += 1;
      } else if (_.status === 'failed') {
        failedTasks += 1;
      } else if (_.status === 'delayed') {
        delayedTasks += 1;
        let diff = new Date(Date.now() - Date.parse(_.to.replace(/-+/g, '/')));
        taskDelay += diff.getTime();
      }
    });
    return constructObject('Tasks', state.last_update, [
      {
        type: 'component',
        status: {
          color: '#2196f3',
          size: 18,
          text: `Assigned: ${assignedTasks}`,
          radius: true,
        },
      },
      {
        type: 'component',
        status: {
          color: '#4caf50',
          size: 18,
          text: `Completed: ${doneTasks}`,
          radius: true,
        },
      },
      {
        type: 'component',
        status: {
          color: '#f44336',
          size: 18,
          text: `Failed: ${failedTasks}`,
          radius: true,
        },
      },
      {
        type: 'component',
        status: {
          color: '#ffb300',
          size: 18,
          text: `Delayed: ${delayedTasks}`,
          radius: true,
        },
      },
      {
        type: 'text',
        text: `Total tasks: ${numberOfTasks}`,
      },
      {
        type: 'text',
        text: `Tasks duration time: ${Utils.getTime(taskDuration)}`,
      },
      {
        type: 'text',
        text: `Delayed time: ${Utils.getTime(taskDelay)}`,
      },
    ]);
  };

  // For Odometer and engine hours
  const constructCounterObjects = (counters) => {};

  const constructObject = (title, time, details) => {
    let trackerObject = {};
    trackerObject.details = [];
    trackerObject.title = title;
    trackerObject.time = Utils.getTimeDifference(time);
    details.map((_, i) => {
      trackerObject.details.push(_);
    });
    return trackerObject;
  };

  useEffect(() => {
    let details = [];
    let tracker;
    let trackerState;
    let trackerModel;
    let lastGPSPoint;
    let trackerReadings;
    let trackerCounters;
    let trackerInputs;
    let trackerTasks;
    Storage.getCurrentTracker()
      .then((result) => {
        tracker = JSON.parse(result);
        return API.getTrackerState(JSON.parse(result).id);
      })
      .then((result) => {
        trackerState = result;
        return API.listModel(tracker.source.model);
      })
      .then((model) => {
        trackerModel = model[0];
        return API.getTrackerLocation(tracker.id);
      })
      .then((gpsPoint) => {
        lastGPSPoint = gpsPoint;
        return API.getAddress({lat: gpsPoint.lat, lng: gpsPoint.lng});
      })
      .then((address) => {
        lastGPSPoint = {...lastGPSPoint, address: address};
        return API.getReadings(tracker.id);
      })
      .then((readings) => {
        trackerReadings = readings;
        return API.getCounters(tracker.id);
      })
      .then((counters) => {
        trackerCounters = counters;
        return API.getInputs(tracker.id);
      })
      .then((inputs) => {
        trackerInputs = inputs;
        return API.getTasks(tracker.id);
      })
      .then((tasks) => {
        trackerTasks = tasks;
        let testTasks = [
          {
            arrival_date: null,
            creation_date: '2020-04-07 13:19:01',
            description: 'Visiting URA',
            external_id: null,
            from: '2020-04-07 00:00:00',
            to: '2020-04-07 23:59:59',
            id: 1,
            label: 'Visiting URA',
            location: {
              address: 'Kampala, Central Region, Uganda, P.O. BOX 4365',
              lat: 0.33036264,
              lng: 32.63800979,
              radius: 50,
            },
            max_delay: 0,
            min_arrival_duration: 0,
            min_stay_duration: 0,
            origin: 'manual',
            status: 'unassigned',
            status_change_date: null,
            stay_duration: 0,
            tracker_id: null,
            type: 'task',
            user_id: 1,
          },
          {
            arrival_date: null,
            creation_date: '2020-04-17 08:40:00',
            description: 'Delivery Parcels in Kampala',
            external_id: '45156',
            form: {
              created: '2020-04-17 08:40:00',
              description: '',
              fields: [Array],
              id: 7,
              label: 'Delivery Note',
              submit_in_zone: false,
              submit_location: [Object],
              submitted: null,
              task_id: 10,
              template_id: 5,
              values: null,
            },
            from: '2020-04-17 00:00:00',
            id: 10,
            label: 'Delivering parcels',
            location: {
              address: 'Kampala Road, Kampala, Uganda',
              lat: 0.3133012,
              lng: 32.5809105,
              radius: 150,
            },
            max_delay: 0,
            min_arrival_duration: 0,
            min_stay_duration: 0,
            origin: 'manual',
            status: 'unassigned',
            status_change_date: null,
            stay_duration: 0,
            to: '2020-04-18 23:59:59',
            tracker_id: null,
            type: 'task',
            user_id: 1,
          },
          {
            arrival_date: null,
            creation_date: '2020-04-17 08:53:33',
            description: '',
            external_id: null,
            form: {
              created: '2020-04-17 08:53:33',
              description: '',
              fields: [Array],
              id: 8,
              label: 'New form',
              submit_in_zone: false,
              submit_location: [Object],
              submitted: null,
              task_id: 11,
              template_id: null,
              values: null,
            },
            from: '2020-04-17 00:00:00',
            id: 11,
            label: 'Power Reconnection',
            location: {
              address: 'Kampala, Uganda',
              lat: 0.3475964,
              lng: 32.5825197,
              radius: 150,
            },
            max_delay: 0,
            min_arrival_duration: 0,
            min_stay_duration: 0,
            origin: 'manual',
            status: 'unassigned',
            status_change_date: null,
            stay_duration: 0,
            to: '2020-04-17 23:59:59',
            tracker_id: null,
            type: 'task',
            user_id: 1,
          },
        ];
        API.getDiagnostics(tracker.id).then((diags) => {
          console.log(diags);
        });
        details.push(constructModelObject(tracker, trackerModel, trackerState));
        details.push(constructLocationObject(trackerState, lastGPSPoint));
        trackerState.gsm
          ? details.push(constructGSMObject(trackerState))
          : null;
        details.push(constructPowerObject(trackerState, trackerReadings));
        details.push(constructInputsObject(trackerInputs));
        details.push(constructTasksObject(trackerState, testTasks));
        // details.push(constructCounterObjects(counters));
        setItemList(details);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        ToastAndroid.show(
          error.message,
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      });
  }, []);

  return (
    <Container>
      <StatusBar backgroundColor="#007aa6" />
      {loading ? (
        <Container>
          <DrawerLoader />
        </Container>
      ) : (
        <StatusContainer
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}>
          {/* TODO Show modal when clicked */}
          {itemList.map((_, i) => {
            return (
              <DetailItem
                key={i}
                title={_.title}
                time={_.time}
                details={_.details}
              />
            );
          })}
        </StatusContainer>
      )}
    </Container>
  );
}

const Container = styled.View`
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #e7f1f7;
`;

const StatusContainer = styled.ScrollView`
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const InputNumber = styled.Text`
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-family: 'Roboto-Regular';
  color: ${(props) => props.color || '#f2994a'};
`;

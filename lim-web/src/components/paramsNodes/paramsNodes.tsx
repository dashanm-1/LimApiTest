import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  ProFormText,
  ProFormTextArea,
  ProFormCascader,
  ProFormItem,
  ProFormDigit,
  ProFormRadio,
  ProFormGroup,
  ProFormSelect,
  EditableProTable,
} from '@ant-design/pro-components';
import { Dropdown, Button, Tooltip, AutoComplete, Tabs, Divider, Radio, Collapse } from 'antd';
import { paramsJsonToTable, paramsTableToJson } from './func';
import JsonEditor from '@/components/JsonEditor';
import { CodeEditNode } from '@/components/codeEdit';
import { paramsColumns, paramsFormDataColumns } from './columns';
import { TABLE_MODE, JSON_MODE, TEXT_MODE, CODE_MODE, FORM_MODE } from '@/utils/constant';
export const ParamsNodes = ({
  formRef,
  type,
  paramMode,
  setParamMode,
  paramEditableKeys,
  setParamEditableKeys,
  editorFormRefs,
  paramTypeCand,
  modeOptions,
  parmsType,
  setParmsType,
}: any) => {
  const setParmTypeFunc = (reqParamType: string, index: number, newV: any) => {
    const _types = { ...parmsType };
    if (!_types[reqParamType]) {
      _types[reqParamType] = {};
    }
    _types[reqParamType][index] = { ...newV };
    setParmsType(_types);
  };

  const modeRadioChange = (mode: number, type: string) => {
    let mode_json = { ...paramMode };
    const fieldName = `${type}_source`;
    const modeName = `${type}_mode`;
    const oldMode = mode_json[modeName];
    let data;
    if (![TABLE_MODE, JSON_MODE].includes(oldMode)) {
      data = null;
    } else {
      data = formRef.current.getFieldValue(fieldName);
      if (oldMode == TABLE_MODE) {
        for (let index in parmsType[type] || {}) {
          data[index]['type'] = parmsType[type][index];
        }
      }
    }
    mode_json[modeName] = mode;
    let source = {};
    let newV = null;
    if (mode === TABLE_MODE) {
      let _types = { ...parmsType };
      _types[type] = {};
      setParmsType(_types);
      let editTableKeys: any = { ...paramEditableKeys };
      const fixType = ['header', 'query'].includes(type) ? 'string' : null;
      [newV, editTableKeys[fieldName]] = paramsJsonToTable(data, fixType);
      setParamEditableKeys(editTableKeys);
      source[fieldName] = newV;
    } else {
      if (mode === JSON_MODE) {
        newV = paramsTableToJson(data);
      } else if (mode === TEXT_MODE) {
        source[fieldName] = '请输入';
        formRef.current.setFieldsValue(source);
      }
      source[fieldName] = newV;
    }
    source[modeName] = mode; //radio 使用了proitem，的onvalueschange，所以这里得通过setFields来渲染
    formRef.current.setFieldsValue(source);
    setParamMode(mode_json);
  };

  const paramsContentNode = () => {
    let renderNodes;
    const tableName = `${type}_source`;
    switch (paramMode[`${type}_mode`]) {
      case TABLE_MODE:
        renderNodes = (
          <ProFormItem name={tableName} trigger="onValuesChange">
            <EditableProTable
              bordered
              rowKey="id"
              editableFormRef={editorFormRefs[type]}
              toolBarRender={false}
              columns={paramsColumns(type, paramTypeCand, editorFormRefs[type], setParmTypeFunc)}
              recordCreatorProps={{
                newRecordType: 'dataSource',
                position: 'bottom',
                record: () => ({
                  id: Date.now(),
                  value: null,
                  type: { type: 'string', auto: true },
                }),
              }}
              editable={{
                type: 'multiple',
                editableKeys: paramEditableKeys[tableName] || [],
                onChange: (key) => {
                  paramEditableKeys[tableName] = key;
                  setParamEditableKeys({ ...paramEditableKeys });
                },
                actionRender: (row, _, dom) => {
                  return [dom.delete];
                },
              }}
            />
          </ProFormItem>
        );
        break;
      case JSON_MODE:
        renderNodes = (
          <>
            <ProFormItem name={`${type}_source`}>
              <JsonEditor />
            </ProFormItem>
          </>
        );
        break;
      case TEXT_MODE:
        renderNodes = (
          <>
            <Divider />
            <ProFormTextArea
              name={tableName}
              rules={[{ type: 'string' }]}
              // placeholder="请输入备注信息"
              fieldProps={{
                autoSize: { minRows: 9 },
              }}
            />
          </>
        );
        break;
      case CODE_MODE:
        let tips = '';
        switch (type) {
          case 'expect':
            tips =
              '# 说明：response无值时代表失败，否则成功，具体规则点击上方规则说明获取，示例如下：\nif not response:\n\treturn False';
            break;
          case 'body':
            tips =
              "# 说明：会将return返回值作为body参数，示例如下：\nimport json \nreturn json.dumps({'a':1,'b':2})";
        }
        const paramName = `${type}_source`;
        const codeValue = formRef.current?.getFieldValue(paramName);
        let initValue;
        if (codeValue) {
          initValue = codeValue;
        } else {
          initValue = tips;
          let _dict = {};
          _dict[paramName] = tips;
          formRef.current?.setFieldsValue(_dict);
        }

        renderNodes = (
          <>
            <Divider />
            <ProFormItem name={paramName} style={{ marginTop: 8 }}>
              <CodeEditNode
                initValue={initValue}
                onChangeFunc={(value: string) => {
                  let _dict = {};
                  _dict[paramName] = value;
                  formRef.current.setFieldsValue(_dict);
                }}
              />
              <Divider />
            </ProFormItem>
          </>
        );
        break;
      case FORM_MODE:
        renderNodes = (
          <ProFormItem name={tableName} trigger="onValuesChange">
            <EditableProTable
              bordered
              rowKey="id"
              toolBarRender={false}
              columns={paramsFormDataColumns()}
              recordCreatorProps={{
                newRecordType: 'dataSource',
                position: 'bottom',
                record: () => ({ id: Date.now() }),
              }}
              editable={{
                type: 'multiple',
                editableKeys: paramEditableKeys[tableName] || [],
                onChange: (key) => {
                  paramEditableKeys[tableName] = key;
                  setParamEditableKeys({ ...paramEditableKeys });
                },
                actionRender: (row, _, dom) => {
                  return [dom.delete];
                },
              }}
            />
          </ProFormItem>
        );
        break;
      default:
        break;
    }
    if (!modeOptions) {
      modeOptions = [
        {
          label: '列表模式',
          value: TABLE_MODE,
        },
        {
          label: 'Json模式',
          value: JSON_MODE,
        },
      ];
      if (['expect', 'output'].includes(type)) {
        modeOptions[1] = {
          label: '代码模式',
          value: CODE_MODE,
        };
      } else if (type === 'body') {
        modeOptions = [
          ...modeOptions,
          ...[
            {
              label: '代码模式',
              value: CODE_MODE,
            },
            {
              label: '文本',
              value: TEXT_MODE,
            },
            {
              label: '表单/上传文件',
              value: FORM_MODE,
            },
          ],
        ];
      }
    }
    return (
      <>
        <div className="mode">
          <ProFormRadio.Group
            name={`${type}_mode`}
            trigger="onValuesChange"
            options={modeOptions}
            fieldProps={{ onChange: (e) => modeRadioChange(e.target.value, type) }}
          />
        </div>
        {renderNodes}
      </>
    );
  };
  return <>{paramsContentNode()}</>;
};
